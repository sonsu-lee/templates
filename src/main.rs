mod cli;
mod create;
#[cfg(test)]
mod embedding;
mod error;
mod templates;

use clap::Parser;
use cli::{Cli, Commands};
use error::Failure;
use std::io::{self, Write};
use std::process::ExitCode;
use templates::Template;

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            // A disconnected terminal can make stderr fail too; preserve the error code.
            let _ = writeln!(io::stderr(), "error: {error}");
            ExitCode::from(error.code)
        }
    }
}

fn run(cli: Cli) -> Result<(), Failure> {
    let mut stdout = io::stdout().lock();
    match cli.command {
        Commands::List => {
            for template in Template::ALL {
                let options = match template {
                    Template::Fullstack => "--template next",
                    Template::NodeNest => "--template next-nest --web node (default web)",
                    Template::StaticNest => "--template next-nest --web static",
                };
                writeln!(stdout, "{}: {options}", template.directory())?;
            }
        }
        Commands::Create {
            destination,
            template,
            web,
        } => {
            let template = cli::choose(template, web)?;
            let destination = create::create(&destination, template)?;
            writeln!(
                stdout,
                "Created {} at {}",
                template.directory(),
                destination.display()
            )?;
            writeln!(
                stdout,
                "\nOpen that directory, then run:\n  pnpm install --frozen-lockfile\n  pnpm dev\n\nSee the generated README.md for environment variables and deployment instructions."
            )?;
        }
    }
    Ok(())
}
