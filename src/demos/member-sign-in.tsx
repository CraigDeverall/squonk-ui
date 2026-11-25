import React from "react";
import { z } from "zod";
import {
  Accordion,
  Alert,
  Block,
  Card,
  Heading,
  IconButton,
  Link,
  Motion,
  Popover,
  Tabs,
  Text,
  ThemeStyleBlock,
  VStack,
} from "../components";
import { useAppForm } from "../components/functional/form/form";
import { CheckIcon, HelpIcon, LockIcon } from "../components/functional-primitive/icon/icon";
import styles from "./demos.module.css";

type Audience = "individual" | "household" | "officer";

const ID_LABEL: Record<Audience, string> = {
  individual: "Membership number",
  household: "Household membership number",
  officer: "Officer number",
};

const signInSchema = (idLabel: string) =>
  z.object({
    membershipNumber: z
      .string()
      .trim()
      .min(1, `Enter your ${idLabel.toLowerCase()}`)
      .regex(/^SQ-?\d{3}-?\d{3}$/i, `Enter your ${idLabel.toLowerCase()} like SQ-104-772`),
    password: z.string().min(1, "Enter your password"),
    remember: z.boolean(),
  });

function SignInForm({ audience, onSignedIn }: { audience: Audience; onSignedIn: (id: string) => void }) {
  const idLabel = ID_LABEL[audience];
  const form = useAppForm({
    defaultValues: { membershipNumber: "", password: "", remember: true },
    validators: {
      onChange: signInSchema(idLabel),
      onSubmitAsync: async ({ value }) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        return value.password === "wrong"
          ? { fields: { password: "The password doesn't match this membership number. Check it, or reset your password." } }
          : undefined;
      },
    },
    onSubmit: ({ value }) => onSignedIn(value.membershipNumber),
  });

  return (
    <form.AppForm>
      <form.Form aria-label={`Sign in as ${audience === "officer" ? "a chapter officer" : `a${audience === "individual" ? "n individual member" : " household"}`}`}>
        <form.ErrorSummary />
        <div className={styles.labelWithHelp}>
          <form.AppField name="membershipNumber">
            {(field) => <field.TextField label={idLabel} inputMode="numeric" autoComplete="username" placeholder="SQ-104-772" />}
          </form.AppField>
          <Popover
            size="sm"
            placement="bottom-end"
            title={`Where to find your ${idLabel.toLowerCase()}`}
            trigger={<IconButton icon={<HelpIcon />} label={`Where to find your ${idLabel.toLowerCase()}`} tooltip={false} />}
          >
            <Text>It's on your welcome letter, on your membership card and at the top of every dues statement.</Text>
            <Link href="#find-id">Get a reminder by email</Link>
          </Popover>
        </div>
        <form.AppField name="password">
          {(field) => <field.TextField label="Password" type="password" autoComplete="current-password" />}
        </form.AppField>
        <form.AppField name="remember">{(field) => <field.Checkbox label="Remember my ID on this device" />}</form.AppField>
        <form.SubmitButton fullWidth pendingLabel="Signing in…">Sign in</form.SubmitButton>
        <Link href="#forgot">Forgotten your password?</Link>
      </form.Form>
    </form.AppForm>
  );
}

/** Sign-in for individual members, households and chapter officers. */
export function MemberSignIn() {
  const [signedIn, setSignedIn] = React.useState<string>();
  const form = (audience: Audience) => <SignInForm audience={audience} onSignedIn={setSignedIn} />;

  return (
    <div className={styles.signInPage}>
      {/* The brand panel takes the opposite light/dark mode, so it stays a
          contrasting band under any theme. */}
      <ThemeStyleBlock invertMode>
        <Block background="default" className={styles.signInBrand}>
          <span className={styles.signInMark} aria-hidden="true">S</span>
          <ThemeStyleBlock register="display">
            <VStack gap="sm">
              <Heading level={1}>Squonk Society</Heading>
              <Text tone="secondary">Log sightings, check your dues and keep up with your chapter, any time.</Text>
            </VStack>
          </ThemeStyleBlock>
          <ul className={styles.signInPoints}>
            {["See what you owe and when it's due", "Log a sighting from the field", "Set up a dues instalment plan"].map((point) => (
              <li key={point}><CheckIcon size="control" /> {point}</li>
            ))}
          </ul>
          <Text tone="secondary" className={styles.signInSecure}><LockIcon size="control" /> Your session is encrypted and times out after 20 minutes.</Text>
        </Block>
      </ThemeStyleBlock>

      <main className={styles.signInMain}>
        <div className={styles.signInColumn}>
          {/* The sign-in pane arrives in sequence beside the brand panel. */}
          <Motion.Stagger>
            <Motion.Presence show playOnMount>
              <Heading level={2}>Sign in</Heading>
            </Motion.Presence>

            <Motion.Presence show playOnMount>
              <Card variant="elevated">
                {/* Signing in swaps the form for the welcome. */}
                <Motion.Swap watch={Boolean(signedIn)}>
                  {signedIn ? (
                    <Alert tone="success" title="Signed in">
                      Welcome back, {signedIn}. In a real service you would now see your account.
                    </Alert>
                  ) : (
                    <Tabs
                      variant="enclosed"
                      fitted
                      listLabel="I am signing in as"
                      items={[
                        { value: "individual", label: "Member", content: form("individual") },
                        { value: "household", label: "Household", content: form("household") },
                        { value: "officer", label: "Chapter officer", content: form("officer") },
                      ]}
                      lazy
                    />
                  )}
                </Motion.Swap>
              </Card>
            </Motion.Presence>

            {/* Accordion keeps its own ref, so Presence moves a wrapper. */}
            <Motion.Presence show playOnMount>
              <div>
                <Accordion
                  variant="contained"
                  headingLevel={2}
                  items={[
                    {
                      value: "locked",
                      title: "My account is locked",
                      content: <Text>After five wrong passwords your account locks for 30 minutes. Reset your password to unlock it straight away.</Text>,
                    },
                    {
                      value: "no-id",
                      title: "I don't have a membership number yet",
                      content: (
                        <Text>
                          You get one when you join. <Link href="#join">Join the Society</Link>
                        </Text>
                      ),
                    },
                    {
                      value: "officer",
                      title: "I'm signing in for my chapter",
                      content: <Text>Choose Chapter officer and use your officer number. You'll see the members who belong to your chapter.</Text>,
                    },
                  ]}
                />
              </div>
            </Motion.Presence>
          </Motion.Stagger>
        </div>
      </main>
    </div>
  );
}
