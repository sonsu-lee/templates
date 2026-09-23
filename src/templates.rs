#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Template {
    Fullstack,
    NodeNest,
    StaticNest,
}

impl Template {
    pub const ALL: [Self; 3] = [Self::Fullstack, Self::NodeNest, Self::StaticNest];

    pub const fn directory(self) -> &'static str {
        match self {
            Self::Fullstack => "next-fullstack",
            Self::NodeNest => "next-node-nest",
            Self::StaticNest => "next-static-nest",
        }
    }
}

impl std::fmt::Display for Template {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let description = match self {
            Self::Fullstack => "Next.js UI and API in one Node server",
            Self::NodeNest => "Next.js Node server + separate NestJS API",
            Self::StaticNest => "Next.js static export + separate NestJS API",
        };
        write!(f, "{}  {description}", self.directory())
    }
}
