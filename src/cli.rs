use std::io::{self, IsTerminal};
use std::path::PathBuf;

use clap::{Parser, Subcommand, ValueEnum};
use dialoguer::Select;

use crate::error::Failure;
use crate::templates::Template;

impl ValueEnum for Template {
    fn value_variants<'a>() -> &'a [Self] {
        &Self::ALL
    }

    fn to_possible_value(&self) -> Option<clap::builder::PossibleValue> {
        Some(clap::builder::PossibleValue::new(self.directory()))
    }
}

#[derive(Parser, Debug)]
#[command(
    version = concat!(
        env!("CARGO_PKG_VERSION"),
        " (source ",
        env!("SONSU_SOURCE_REVISION"),
        ")"
    ),
    about = "Create projects from embedded Next.js templates"
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// List available template IDs and descriptions
    Templates,
    /// Copy a template into a new directory (its parent must already exist)
    Create {
        destination: PathBuf,
        /// Template ID; opens an arrow-key menu when omitted in a terminal
        #[arg(long, value_enum)]
        template: Option<Template>,
    },
}

pub fn choose(template: Option<Template>) -> Result<Template, Failure> {
    if let Some(template) = template {
        return Ok(template);
    }
    if !io::stdin().is_terminal() || !io::stderr().is_terminal() {
        return Err(Failure::input(
            "--template is required when stdin and stderr are not both terminals; run 'sonsu templates' to choose an ID",
        ));
    }
    prompt()
}

fn prompt() -> Result<Template, Failure> {
    let selection = Select::new()
        .with_prompt("Template")
        .items(&Template::ALL)
        .default(0)
        .interact_opt()
        .map_err(|error| Failure::io(format!("Unable to read terminal selection: {error}")))?;
    match selection {
        Some(index) => Template::ALL
            .get(index)
            .copied()
            .ok_or_else(|| Failure::input("Invalid template selection")),
        None => Err(Failure::cancelled()),
    }
}
