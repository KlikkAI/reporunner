//! # Reporunner Rust SDK
//!
//! The official Rust SDK for the Reporunner workflow automation platform.
//!
//! ## Features
//!
//! - Async/await support with Tokio
//! - WebSocket streaming for real-time updates
//! - Type-safe API with comprehensive error handling
//! - Structured logging with tracing
//! - Memory and performance optimized
//!
//! ## Quick Start
//!
//! ```rust
//! use reporunner_sdk::{Client, CreateWorkflowRequest, NodeDefinition, Position};
//! use std::collections::HashMap;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = Client::new("http://localhost:3001")
//!         .with_api_key("your-api-key");
//!
//!     let workflow = client.create_workflow(CreateWorkflowRequest {
//!         name: "Rust Workflow".to_string(),
//!         description: "Created from Rust SDK".to_string(),
//!         nodes: vec![NodeDefinition {
//!             id: "trigger-1".to_string(),
//!             name: "Start".to_string(),
//!             node_type: "trigger".to_string(),
//!             position: Position { x: 100.0, y: 100.0 },
//!             parameters: HashMap::new(),
//!         }],
//!         connections: vec![],
//!         settings: None,
//!     }).await?;
//!
//!     println!("Created workflow: {}", workflow.id);
//!     Ok(())
//! }
//! ```

use std::collections::HashMap;
use std::time::Duration;

mod client;
mod error;
mod models;
mod websocket;

pub use client::Client;
pub use error::{Error, Result};
pub use models::*;

/// Default timeout for HTTP requests
pub const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

/// Default base URL for the Reporunner API
pub const DEFAULT_BASE_URL: &str = "http://localhost:3001";