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
        Commands::Templates => {
            for template in Template::ALL {
                writeln!(stdout, "{template}")?;
            }
        }
        Commands::Create {
            destination,
            template,
        } => {
            let template = cli::choose(template)?;
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
