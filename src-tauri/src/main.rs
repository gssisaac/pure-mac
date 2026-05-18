// Prevents additional console window on Windows in debug, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    puremac_lib::run();
}
