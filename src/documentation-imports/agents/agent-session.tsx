import React from "react";
import { Badge, Card, Code, Text, VStack } from "../../components";
import styles from "./agent-session.module.css";

const STEPS: { tool: string; does: string }[] = [
  { tool: "find_components", does: "Searches the installed catalog for a form, a text field and a button, and gets their import paths." },
  { tool: "get_component", does: "Reads TextField's props, accessibility guidance and pitfalls before using it." },
  { tool: "preview_story", does: "Shows you the library's sign-in example with live controls, so you can agree on the layout first." },
];

/** What a short session with an agent looks like, step by step. */
export function AgentSession() {
  return (
    <Card variant="outlined">
      <VStack gap="md">
        <div className={styles.prompt}>
          <Text tone="secondary">You</Text>
          <Text>Build a sign-in form with @squonkstack/ui. Show me what the library has first.</Text>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.tool} className={styles.step}>
              <Badge tone="primary"><Code>{step.tool}</Code></Badge>
              <Text>{step.does}</Text>
            </li>
          ))}
        </ol>
        <Text tone="secondary">
          The skill it read first told it how forms work here, so the form has labels, an error summary and one
          submit button. The lint rules check the code it wrote, and it looks at the result in your running app.
        </Text>
      </VStack>
    </Card>
  );
}
