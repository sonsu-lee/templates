use std::io::{self, IsTerminal};
use std::path::PathBuf;

use clap::{Parser, Subcommand, ValueEnum};
use dialoguer::Select;

use crate::error::Failure;
use crate::templates::Template;

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
    /// List available templates and their explicit selection options
    Templates,
    /// Copy a template into a new directory (its parent must already exist)
    Create {
        destination: PathBuf,
        /// Architecture; opens an arrow-key menu when omitted in a terminal
        #[arg(long, value_enum)]
        template: Option<Architecture>,
        /// Web deployment; defaults to node with an explicit --template
        #[arg(long, value_enum)]
        web: Option<Web>,
    },
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, ValueEnum)]
pub enum Architecture {
    Next,
    NextNest,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, ValueEnum)]
pub enum Web {
    Node,
    Static,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Menu {
    Architecture,
    Web,
}

pub fn choose(template: Option<Architecture>, web: Option<Web>) -> Result<Template, Failure> {
    resolve(
        template,
        web,
        io::stdin().is_terminal() && io::stderr().is_terminal(),
        prompt,
    )
}

fn prompt(menu: Menu) -> Result<usize, Failure> {
    let (title, items) = match menu {
        Menu::Architecture => ("Architecture", ["Next.js fullstack", "Next.js + NestJS"]),
        Menu::Web => ("Web deployment", ["Node server", "Static export"]),
    };
    Select::new()
        .with_prompt(title)
        .items(items)
        .default(0)
        .interact_opt()
        .map_err(|error| Failure::io(format!("Unable to read terminal selection: {error}")))?
        .ok_or_else(Failure::cancelled)
}

fn resolve(
    template: Option<Architecture>,
    web: Option<Web>,
    interactive: bool,
    mut prompt: impl FnMut(Menu) -> Result<usize, Failure>,
) -> Result<Template, Failure> {
    let prompted = template.is_none();
    let architecture = match template {
        Some(value) => value,
        None if interactive => match prompt(Menu::Architecture)? {
            0 => Architecture::Next,
            1 => Architecture::NextNest,
            _ => return Err(Failure::input("Invalid architecture selection")),
        },
        None => {
            return Err(Failure::input(
                "--template is required when stdin and stderr are not both terminals",
            ));
        }
    };
    let web = match web {
        Some(value) => value,
        None if prompted && architecture == Architecture::NextNest => match prompt(Menu::Web)? {
            0 => Web::Node,
            1 => Web::Static,
            _ => return Err(Failure::input("Invalid web deployment selection")),
        },
        None => Web::Node,
    };
    match (architecture, web) {
        (Architecture::Next, Web::Node) => Ok(Template::Fullstack),
        (Architecture::Next, Web::Static) => Err(Failure::input(
            "--template next does not support --web static; use --template next-nest --web static",
        )),
        (Architecture::NextNest, Web::Node) => Ok(Template::NodeNest),
        (Architecture::NextNest, Web::Static) => Ok(Template::StaticNest),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn menus_resolve_all_three_variants_in_order() {
        for (answers, expected_menus, expected) in [
            (vec![0], vec![Menu::Architecture], Template::Fullstack),
            (
                vec![1, 0],
                vec![Menu::Architecture, Menu::Web],
                Template::NodeNest,
            ),
            (
                vec![1, 1],
                vec![Menu::Architecture, Menu::Web],
                Template::StaticNest,
            ),
        ] {
            let mut answers = answers.into_iter();
            let mut menus = Vec::new();
            let actual = resolve(None, None, true, |menu| {
                menus.push(menu);
                Ok(answers.next().unwrap())
            })
            .unwrap();
            assert_eq!(actual, expected);
            assert_eq!(menus, expected_menus);
        }
    }

    #[test]
    fn explicit_template_never_prompts_even_in_a_terminal() {
        assert_eq!(
            resolve(Some(Architecture::NextNest), None, true, |_| panic!(
                "unexpected prompt"
            ))
            .unwrap(),
            Template::NodeNest
        );
    }

    #[test]
    fn explicit_web_is_preserved_after_architecture_prompt() {
        let mut menus = Vec::new();
        assert_eq!(
            resolve(None, Some(Web::Static), true, |menu| {
                menus.push(menu);
                Ok(1)
            })
            .unwrap(),
            Template::StaticNest
        );
        assert_eq!(menus, [Menu::Architecture]);
        assert_eq!(
            resolve(None, Some(Web::Static), true, |_| Ok(0))
                .unwrap_err()
                .code,
            2
        );
    }

    #[test]
    fn non_terminal_and_cancellation_do_not_fall_back_to_a_template() {
        assert_eq!(
            resolve(None, None, false, |_| panic!("unexpected prompt"))
                .unwrap_err()
                .code,
            2
        );
        for cancel_at in [Menu::Architecture, Menu::Web] {
            let error = resolve(None, None, true, |menu| {
                if menu == cancel_at {
                    Err(Failure::cancelled())
                } else {
                    Ok(1)
                }
            })
            .unwrap_err();
            assert_eq!(error.code, 130);
        }
    }
}
