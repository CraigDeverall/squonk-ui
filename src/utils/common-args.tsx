export const ref = {
  control: false,
  table: {
    type: { summary: "React.Ref" },
    defaultValue: { summary: "null" },
  },
  description: "Ref to the component",
};
export const as = {
  control: { type: "text" },
  table: {
    type: { summary: "React.ElementType" },
    defaultValue: { summary: "button" },
  },
  description: "The html tag or React component to render as",
};
