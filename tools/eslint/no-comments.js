const rule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      forbidden:
        "Comments are forbidden: name things so they explain themselves, put the why in the commit or in docs/arquitectura/decisiones.md.",
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          context.report({ loc: comment.loc, messageId: "forbidden" });
        }
      },
    };
  },
};

const plugin = { rules: { "no-comments": rule } };

export default plugin;
