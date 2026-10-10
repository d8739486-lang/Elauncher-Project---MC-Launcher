use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use sha2::Sha256;
use std::fs::File;
use std::io::{BufReader, Read};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashResult {
    pub file_name: String,
    pub full_path: String,
    pub hash: String,
    pub size: u64,
}

/// Computes SHA-1 or SHA-256 for a given file with 64KB chunked buffer.
pub fn hash_file(file_path: &Path, algorithm: &str) -> Result<String, String> {
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", file_path.display()));
    }

    let file = File::open(file_path).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut reader = BufReader::with_capacity(64 * 1024, file);
    let mut buffer = [0u8; 64 * 1024];

    if algorithm.eq_ignore_ascii_case("sha256") {
        let mut hasher = Sha256::new();
        while let Ok(bytes_read) = reader.read(&mut buffer) {
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }
        Ok(format!("{:x}", hasher.finalize()))
    } else {
        let mut hasher = Sha1::new();
        while let Ok(bytes_read) = reader.read(&mut buffer) {
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }
        Ok(format!("{:x}", hasher.finalize()))
    }
}

/// Scans a directory for all .jar files (e.g. /mods) and hashes them in parallel.
pub fn hash_folder_jars(dir_path: &Path, algorithm: &str) -> Vec<HashResult> {
    if !dir_path.exists() {
        return Vec::new();
    }

    let jar_paths: Vec<_> = WalkDir::new(dir_path)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|entry| {
            entry.file_type().is_file()
                && entry
                    .path()
                    .extension()
                    .map_or(false, |ext| ext.eq_ignore_ascii_case("jar"))
        })
        .map(|entry| entry.into_path())
        .collect();

    jar_paths
        .par_iter()
        .filter_map(|path| {
            let meta = path.metadata().ok()?;
            let file_name = path.file_name()?.to_string_lossy().to_string();
            let full_path = path.to_string_lossy().to_string();
            let hash = hash_file(path, algorithm).ok()?;

            Some(HashResult {
                file_name,
                full_path,
                hash,
                size: meta.len(),
            })
        })
        .collect()
}
