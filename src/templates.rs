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
