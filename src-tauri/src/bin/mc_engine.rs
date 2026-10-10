use app_lib::engine::{
    extract_archive, extract_natives, hash_file, hash_folder_jars, verify_assets_parallel,
    AssetCheckItem,
};
use serde_json::json;
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: mc_engine <command> [options]");
        eprintln!("Commands: extract, natives, verify, hash, hash-folder");
        std::process::exit(1);
    }

    let command = args[1].as_str();

    match command {
        "extract" => {
            let mut archive = String::new();
            let mut dest = String::new();

            let mut i = 2;
            while i < args.len() {
                match args[i].as_str() {
                    "--archive" => {
                        if i + 1 < args.len() {
                            archive = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    "--dest" => {
                        if i + 1 < args.len() {
                            dest = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }

            if archive.is_empty() || dest.is_empty() {
                let err = json!({"success": false, "error": "Missing --archive or --dest"});
                println!("{}", err);
                std::process::exit(1);
            }

            match extract_archive(Path::new(&archive), Path::new(&dest)) {
                Ok(stats) => {
                    let out = json!({"success": true, "data": stats});
                    println!("{}", out);
                }
                Err(e) => {
                    let out = json!({"success": false, "error": e});
                    println!("{}", out);
                    std::process::exit(1);
                }
            }
        }
        "natives" => {
            let mut jar = String::new();
            let mut dest = String::new();
            let mut excludes = Vec::new();

            let mut i = 2;
            while i < args.len() {
                match args[i].as_str() {
                    "--jar" => {
                        if i + 1 < args.len() {
                            jar = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    "--dest" => {
                        if i + 1 < args.len() {
                            dest = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    "--exclude" => {
                        if i + 1 < args.len() {
                            excludes = args[i + 1].split(',').map(|s| s.trim().to_string()).collect();
                            i += 1;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }

            if jar.is_empty() || dest.is_empty() {
                let err = json!({"success": false, "error": "Missing --jar or --dest"});
                println!("{}", err);
                std::process::exit(1);
            }

            match extract_natives(Path::new(&jar), Path::new(&dest), &excludes) {
                Ok(stats) => {
                    let out = json!({"success": true, "data": stats});
                    println!("{}", out);
                }
                Err(e) => {
                    let out = json!({"success": false, "error": e});
                    println!("{}", out);
                    std::process::exit(1);
                }
            }
        }
        "verify" => {
            let mut manifest_path = String::new();

            let mut i = 2;
            while i < args.len() {
                if args[i] == "--manifest" && i + 1 < args.len() {
                    manifest_path = args[i + 1].clone();
                    i += 1;
                }
                i += 1;
            }

            if manifest_path.is_empty() {
                let err = json!({"success": false, "error": "Missing --manifest <path>"});
                println!("{}", err);
                std::process::exit(1);
            }

            let file_data = match fs::read_to_string(&manifest_path) {
                Ok(d) => d,
                Err(e) => {
                    let err = json!({"success": false, "error": format!("Could not read manifest: {}", e)});
                    println!("{}", err);
                    std::process::exit(1);
                }
            };

            let items: Vec<AssetCheckItem> = match serde_json::from_str(&file_data) {
                Ok(v) => v,
                Err(e) => {
                    let err = json!({"success": false, "error": format!("Invalid JSON manifest: {}", e)});
                    println!("{}", err);
                    std::process::exit(1);
                }
            };

            let report = verify_assets_parallel(&items);
            let out = json!({"success": true, "data": report});
            println!("{}", out);
        }
        "hash" => {
            let mut file_path = String::new();
            let mut algo = "sha1".to_string();

            let mut i = 2;
            while i < args.len() {
                match args[i].as_str() {
                    "--file" => {
                        if i + 1 < args.len() {
                            file_path = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    "--algo" => {
                        if i + 1 < args.len() {
                            algo = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }

            if file_path.is_empty() {
                let err = json!({"success": false, "error": "Missing --file"});
                println!("{}", err);
                std::process::exit(1);
            }

            match hash_file(Path::new(&file_path), &algo) {
                Ok(hash) => {
                    let out = json!({"success": true, "hash": hash, "algo": algo});
                    println!("{}", out);
                }
                Err(e) => {
                    let out = json!({"success": false, "error": e});
                    println!("{}", out);
                    std::process::exit(1);
                }
            }
        }
        "hash-folder" => {
            let mut folder_path = String::new();
            let mut algo = "sha1".to_string();

            let mut i = 2;
            while i < args.len() {
                match args[i].as_str() {
                    "--folder" => {
                        if i + 1 < args.len() {
                            folder_path = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    "--algo" => {
                        if i + 1 < args.len() {
                            algo = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }

            let results = hash_folder_jars(Path::new(&folder_path), &algo);
            let out = json!({"success": true, "files": results});
            println!("{}", out);
        }
        _ => {
            let err = json!({"success": false, "error": format!("Unknown command: {}", command)});
            println!("{}", err);
            std::process::exit(1);
        }
    }
}
