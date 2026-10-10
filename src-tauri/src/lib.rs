pub mod engine;

use engine::{
    extract_archive, extract_natives, hash_file, hash_folder_jars, verify_assets_parallel,
    AssetCheckItem, HashResult, UnpackStats, VerificationReport,
};
use std::path::Path;

#[tauri::command]
pub fn extract_archive_command(archive_path: String, destination: String) -> Result<UnpackStats, String> {
    extract_archive(Path::new(&archive_path), Path::new(&destination))
}

#[tauri::command]
pub fn extract_natives_command(
    jar_path: String,
    destination: String,
    exclude_prefixes: Vec<String>,
) -> Result<UnpackStats, String> {
    extract_natives(Path::new(&jar_path), Path::new(&destination), &exclude_prefixes)
}

#[tauri::command]
pub fn verify_assets_command(assets: Vec<AssetCheckItem>) -> VerificationReport {
    verify_assets_parallel(&assets)
}

#[tauri::command]
pub fn hash_file_command(file_path: String, algorithm: String) -> Result<String, String> {
    hash_file(Path::new(&file_path), &algorithm)
}

#[tauri::command]
pub fn hash_folder_jars_command(folder_path: String, algorithm: String) -> Vec<HashResult> {
    hash_folder_jars(Path::new(&folder_path), &algorithm)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            extract_archive_command,
            extract_natives_command,
            verify_assets_command,
            hash_file_command,
            hash_folder_jars_command
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
