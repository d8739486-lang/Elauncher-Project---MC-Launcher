use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{self, BufReader, BufWriter};
use std::path::{Path, PathBuf};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnpackStats {
    pub success: bool,
    pub files_extracted: usize,
    pub total_bytes: u64,
    pub elapsed_ms: u64,
    pub error: Option<String>,
}

/// Safely extracts a zip or jar archive into the target folder.
/// Automatically handles folder creation and protects against Zip Slip attacks.
pub fn extract_archive(archive_path: &Path, destination: &Path) -> Result<UnpackStats, String> {
    let start_time = Instant::now();

    if !archive_path.exists() {
        return Err(format!("Archive does not exist: {}", archive_path.display()));
    }

    fs::create_dir_all(destination).map_err(|e| {
        format!("Failed to create destination directory {}: {}", destination.display(), e)
    })?;

    let file = File::open(archive_path).map_err(|e| {
        format!("Failed to open archive file: {}", e)
    })?;

    let reader = BufReader::with_capacity(128 * 1024, file);
    let mut archive = zip::ZipArchive::new(reader).map_err(|e| {
        format!("Failed to read zip archive {}: {}", archive_path.display(), e)
    })?;

    let mut files_extracted = 0;
    let mut total_bytes = 0u64;

    for i in 0..archive.len() {
        let mut zip_file = match archive.by_index(i) {
            Ok(f) => f,
            Err(e) => return Err(format!("Error reading archive entry #{}: {}", i, e)),
        };

        let raw_enclosed = match zip_file.enclosed_name() {
            Some(path) => path.to_owned(),
            None => {
                // Skips unsafe entries (path traversal / absolute paths)
                continue;
            }
        };

        let outpath = destination.join(raw_enclosed);

        if zip_file.is_dir() {
            fs::create_dir_all(&outpath).map_err(|e| {
                format!("Failed to create directory {}: {}", outpath.display(), e)
            })?;
        } else {
            if let Some(parent) = outpath.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).map_err(|e| {
                        format!("Failed to create parent dir {}: {}", parent.display(), e)
                    })?;
                }
            }

            let mut outfile = BufWriter::with_capacity(
                64 * 1024,
                File::create(&outpath).map_err(|e| {
                    format!("Failed to create extracted file {}: {}", outpath.display(), e)
                })?,
            );

            let copied = io::copy(&mut zip_file, &mut outfile).map_err(|e| {
                format!("Failed to write file {}: {}", outpath.display(), e)
            })?;

            total_bytes += copied;
            files_extracted += 1;
        }
    }

    let elapsed_ms = start_time.elapsed().as_millis() as u64;

    Ok(UnpackStats {
        success: true,
        files_extracted,
        total_bytes,
        elapsed_ms,
        error: None,
    })
}

/// Specialized extraction for Minecraft native library jars (.dll, .so, .dylib).
/// Filters out META-INF directories, checksum files, and unwanted non-binary resources.
pub fn extract_natives(
    jar_path: &Path,
    destination: &Path,
    exclude_prefixes: &[String],
) -> Result<UnpackStats, String> {
    let start_time = Instant::now();

    if !jar_path.exists() {
        return Err(format!("Native jar does not exist: {}", jar_path.display()));
    }

    fs::create_dir_all(destination).map_err(|e| {
        format!("Failed to create natives directory: {}", e)
    })?;

    let file = File::open(jar_path).map_err(|e| format!("Failed to open jar: {}", e))?;
    let reader = BufReader::new(file);
    let mut archive = zip::ZipArchive::new(reader).map_err(|e| {
        format!("Invalid zip/jar archive: {}", e)
    })?;

    let mut files_extracted = 0;
    let mut total_bytes = 0u64;

    for i in 0..archive.len() {
        let mut zip_file = match archive.by_index(i) {
            Ok(f) => f,
            Err(_) => continue,
        };

        let raw_name = match zip_file.enclosed_name() {
            Some(p) => p.to_string_lossy().to_string(),
            None => continue,
        };

        // Skip standard meta info and signature folders
        let normalized = raw_name.replace('\\', "/");
        if normalized.starts_with("META-INF/") || normalized.ends_with(".git") || normalized.ends_with(".sha1") {
            continue;
        }

        // Skip user-defined exclusions
        if exclude_prefixes.iter().any(|prefix| normalized.starts_with(prefix)) {
            continue;
        }

        let outpath = destination.join(&raw_name);

        if zip_file.is_dir() {
            fs::create_dir_all(&outpath).map_err(|e| format!("Error creating dir: {}", e))?;
        } else {
            if let Some(parent) = outpath.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).map_err(|e| format!("Error creating dir: {}", e))?;
                }
            }

            let mut outfile = BufWriter::new(File::create(&outpath).map_err(|e| {
                format!("Failed to create native file {}: {}", outpath.display(), e)
            })?);

            let copied = io::copy(&mut zip_file, &mut outfile).map_err(|e| {
                format!("Failed to write native file: {}", e)
            })?;

            total_bytes += copied;
            files_extracted += 1;
        }
    }

    Ok(UnpackStats {
        success: true,
        files_extracted,
        total_bytes,
        elapsed_ms: start_time.elapsed().as_millis() as u64,
        error: None,
    })
}
