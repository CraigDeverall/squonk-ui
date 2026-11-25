import React from "react";
import { Button, Card, Heading, Text, TextField, VStack } from "../../components";

/** The "first screen" example on Getting started, rendered live. */
export function FirstScreen() {
  const [name, setName] = React.useState("");
  const [saved, setSaved] = React.useState<string>();
  return (
    <Card style={{ maxWidth: 420 }}>
      <VStack gap="md">
        <Heading level={3} as="p">Your workspace</Heading>
        <Text tone="secondary">Give it a name your team will recognise.</Text>
        <TextField label="Workspace name" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <Button variant="primary" onClick={() => setSaved(name.trim() || "Untitled")}>Create workspace</Button>
        </div>
        {saved ? <Text role="status">Created “{saved}”.</Text> : null}
      </VStack>
    </Card>
  );
}
