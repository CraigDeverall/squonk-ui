import React from "react";
import { DocsNavigation, docsHref } from "./docs-navigation";
import { z } from "zod";
import {
  Motion,
  Accordion,
  Alert,
  AspectRatio,
  Avatar,
  Badge,
  Block,
  Breadcrumb,
  Button,
  Card,
  Centered,
  Checkbox,
  CheckboxGroup,
  Cluster,
  Code,
  ConfirmModal,
  Container,
  Divider,
  Drawer,
  DropdownMenu,
  EmptyState,
  Fieldset,
  Footer,
  Grid,
  HStack,
  Header,
  Heading,
  IconButton,
  InfiniteList,
  Inline,
  InteractiveCard,
  Kbd,
  Link,
  MediaObject,
  Pagination,
  Popover,
  Presentation,
  ProgressBar,
  QrCode,
  RadioGroup,
  ScrollBox,
  Section,
  SectionHeading,
  Select,
  Sidebar,
  Skeleton,
  Spacer,
  Spinner,
  Split,
  Switch,
  Table,
  Tabs,
  Tag,
  TagGroup,
  Text,
  TextField,
  Textarea,
  ThemeModifier,
  ThemeStyleBlock,
  ToastProvider,
  Tooltip,
  VStack,
  useToast,
} from "../components";
import { HelpIcon, MoreIcon, SearchIcon, SettingsIcon, StarIcon } from "../components/functional-primitive/icon/icon";
import { useAppForm } from "../components/functional/form/form";
import styles from "./component-gallery.module.css";

interface Entry {
  name: string;
  /** The component's docs id, without `--docs` (the `id` pinned in its stories). */
  id: string;
  purpose: string;
  example: React.ReactNode;
}

interface Group {
  title: string;
  intro: string;
  entries: Entry[];
}

const OpenModal = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Delete draft…</Button>
      <ConfirmModal
        open={open}
        title="Delete this draft?"
        message="You can't undo this."
        confirmLabel="Delete"
        danger
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

const OpenDrawer = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open case</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Case C-20260400">
        <Text>Sighting needs verification. Opened 1 August 2026.</Text>
      </Drawer>
    </>
  );
};

const ShowToast = () => {
  const toast = useToast();
  return <Button variant="secondary" onClick={() => toast.success("Your sighting was logged.")}>Show a toast</Button>;
};

const MiniForm = () => {
  const [done, setDone] = React.useState(false);
  const form = useAppForm({
    defaultValues: { email: "" },
    validators: { onChange: z.object({ email: z.email("Enter an email address") }) },
    onSubmit: () => setDone(true),
  });
  return (
    <form.AppForm>
      <form.Form aria-label="Email updates">
        <form.AppField name="email">{(field) => <field.TextField label="Email" type="email" />}</form.AppField>
        <div><form.SubmitButton>{done ? "Saved" : "Save"}</form.SubmitButton></div>
      </form.Form>
    </form.AppForm>
  );
};

const ReportChoice = () => {
  const [value, setValue] = React.useState("monthly");
  return <RadioGroup name="gallery-report" legend="Report" value={value} onChange={setValue} options={[{ value: "monthly", label: "Monthly" }, { value: "seasonal", label: "Seasonal" }]} />;
};

const PagedExample = () => {
  const [page, setPage] = React.useState(2);
  return <Pagination count={120} pageSize={10} page={page} onPageChange={setPage} compact />;
};

const groups: Group[] = [
  {
    title: "Actions",
    intro: "Do something, or go somewhere.",
    entries: [
      { name: "Button", id: "functional-button", purpose: "Run an action, submit a form or confirm a step.", example: <Button>Save changes</Button> },
      { name: "IconButton", id: "functional-iconbutton", purpose: "An action shown as an icon, named by its tooltip.", example: <IconButton icon={<SettingsIcon />} label="Settings" /> },
      { name: "Link", id: "functional-link", purpose: "Go to another page or place.", example: <Link href="#">View your sightings</Link> },
      {
        name: "Dropdown Menu",
        id: "functional-dropdown-menu",
        purpose: "A list of actions behind one button.",
        example: (
          <DropdownMenu
            triggerLabel="More actions"
            trigger={<MoreIcon size="control" />}
            items={[{ key: "edit", label: "Edit" }, { key: "copy", label: "Duplicate" }, "separator", { key: "delete", label: "Delete", tone: "danger" }]}
          />
        ),
      },
    ],
  },
  {
    title: "Inputs",
    intro: "Collect answers. Labels, help and errors come built in.",
    entries: [
      { name: "Text Field", id: "functional-text-field", purpose: "A single line of text.", example: <TextField label="Member name" placeholder="Aroha Ngata" /> },
      { name: "Textarea", id: "functional-textarea", purpose: "Longer text, with an optional count.", example: <Textarea label="Notes" rows={2} /> },
      {
        name: "Select",
        id: "functional-select",
        purpose: "Choose one option from a list; searchable for long lists.",
        example: <Select label="Region" placeholder="Choose a region" options={[{ value: "wgtn", label: "Wellington" }, { value: "akl", label: "Auckland" }]} />,
      },
      { name: "Checkbox", id: "functional-checkbox", purpose: "Turn one option on or off, saved with the form.", example: <Checkbox label="Send me reminders" defaultChecked /> },
      {
        name: "CheckboxGroup",
        id: "functional-checkboxgroup",
        purpose: "Choose any number of related options.",
        example: <CheckboxGroup legend="Interests" defaultValue={["night-watches"]} options={[{ value: "night-watches", label: "Night watches" }, { value: "tear-pools", label: "Tear-pool mapping" }]} />,
      },
      {
        name: "Radio Group",
        id: "functional-radio-group",
        purpose: "Choose exactly one of a few options.",
        example: <ReportChoice />,
      },
      { name: "Switch", id: "functional-switch", purpose: "A setting that applies straight away.", example: <Switch label="Email notifications" defaultChecked /> },
      {
        name: "Fieldset",
        id: "functional-fieldset",
        purpose: "Group related fields under one legend.",
        example: (
          <Fieldset legend="Contact">
            <TextField label="Phone" />
          </Fieldset>
        ),
      },
      { name: "Form", id: "functional-form", purpose: "Forms on TanStack Form and Zod, with the fields already bound.", example: <MiniForm /> },
    ],
  },
  {
    title: "Feedback",
    intro: "Tell people what happened, what's happening, or that there's nothing here yet.",
    entries: [
      { name: "Alert", id: "functional-alert", purpose: "A message in the page about an action or the system.", example: <Alert tone="success" title="Sighting logged">We sent a copy to your email.</Alert> },
      { name: "Toast", id: "functional-toast", purpose: "A brief confirmation that doesn't interrupt.", example: <ShowToast /> },
      { name: "Progress Bar", id: "functional-progress-bar", purpose: "Progress on work of known or unknown length.", example: <ProgressBar value={60} label="Uploading" showValue /> },
      { name: "Spinner", id: "functional-spinner", purpose: "A short wait.", example: <Spinner label="Loading" /> },
      { name: "Skeleton", id: "functional-skeleton", purpose: "The shape of content while it loads.", example: <Skeleton lines={3} /> },
      {
        name: "Empty State",
        id: "layout-empty-state",
        purpose: "Nothing to show yet, and what to do next.",
        example: <EmptyState icon={<SearchIcon />} title="No cases match" action={<Button variant="ghost">Clear filters</Button>} />,
      },
    ],
  },
  {
    title: "Overlays",
    intro: "Content that appears over the page. Open them to try the keyboard and focus.",
    entries: [
      { name: "Modal", id: "functional-modal", purpose: "A focused task or confirmation that needs an answer.", example: <OpenModal /> },
      { name: "Drawer", id: "functional-drawer", purpose: "Details or a side task, beside the page.", example: <OpenDrawer /> },
      {
        name: "Popover",
        id: "functional-popover",
        purpose: "Extra detail or controls next to their trigger.",
        example: (
          <Popover title="What is the Swamp Fund levy?" trigger={<Button variant="ghost">What is the Swamp Fund levy?</Button>}>
            <Text>A small yearly levy that pays for habitat restoration.</Text>
          </Popover>
        ),
      },
      {
        name: "Tooltip",
        id: "functional-tooltip",
        purpose: "A short label for a control, on hover or focus.",
        example: (
          <Tooltip content="Get help with this page">
            <Button variant="ghost"><HelpIcon size="control" /> Help</Button>
          </Tooltip>
        ),
      },
    ],
  },
  {
    title: "Navigation",
    intro: "Find your way around an app, and around long content.",
    entries: [
      { name: "Breadcrumb", id: "functional-breadcrumb", purpose: "Where this page sits.", example: <Breadcrumb items={[{ label: "Sightings", href: "#" }, { label: "Hemlock Ridge, Sep–Oct" }]} /> },
      {
        name: "Tabs",
        id: "functional-tabs",
        purpose: "Switch between views of the same thing.",
        example: <Tabs listLabel="Cases" items={[{ value: "mine", label: "My cases", content: null }, { value: "team", label: "Team", content: null }]} />,
      },
      { name: "Pagination", id: "functional-pagination", purpose: "Move through pages of results.", example: <PagedExample /> },
      { name: "Header", id: "layout-header", purpose: "The app bar across the top of a screen.", example: <Header as="div"><Text weight="bold">Squonk Society member portal</Text></Header> },
      { name: "Sidebar", id: "layout-sidebar", purpose: "A fixed-width side column, usually navigation.", example: <Sidebar as="div" width="100%"><Text>Overview</Text><Text>Returns</Text></Sidebar> },
      { name: "Footer", id: "layout-footer", purpose: "The bottom of a page, with smaller text.", example: <Footer as="div"><Text>© Squonk</Text></Footer> },
    ],
  },
  {
    title: "Data display",
    intro: "Records, values and the status of things.",
    entries: [
      {
        name: "Table",
        id: "functional-table",
        purpose: "Records in typed columns; sorting, paging and selection built in.",
        example: (
          <Table
            caption="Payments"
            columns={[{ key: "date", header: "Date" }, { key: "amount", header: "Amount", align: "right" }]}
            rows={[{ date: "3 Nov", amount: "$1,240" }, { date: "6 Oct", amount: "$980" }]}
            rowKey="date"
          />
        ),
      },
      {
        name: "InfiniteList",
        id: "functional-infinitelist",
        purpose: "A long feed that loads more as you scroll.",
        example: (
          <InfiniteList
            aria-label="Activity"
            items={["Payment received", "Sighting logged"]}
            getKey={(item) => item}
            renderItem={(item) => <Text>{item}</Text>}
            hasMore={false}
            onLoadMore={() => {}}
            endText="That's everything"
          />
        ),
      },
      { name: "Badge", id: "functional-badge", purpose: "Reports a status or count.", example: <Cluster gap="xs"><Badge tone="error">Overdue</Badge><Badge tone="success">Paid</Badge><Badge tone="primary">3</Badge></Cluster> },
      {
        name: "Tag",
        id: "functional-tag",
        purpose: "Names a value people chose, added or can remove.",
        example: <TagGroup aria-label="Filters"><Tag tone="primary" onRemove={() => {}}>Night watches</Tag><Tag onRemove={() => {}}>Waikato Chapter</Tag></TagGroup>,
      },
      { name: "Avatar", id: "functional-avatar", purpose: "A person, by photo or initials.", example: <Cluster gap="xs"><Avatar name="Aroha Ngata" /><Avatar name="Sam Patel" /></Cluster> },
      {
        name: "Accordion",
        id: "functional-accordion",
        purpose: "Sections that open and close in place.",
        example: <Accordion items={[{ value: "late", title: "What if I pay my dues late?", content: <Text>A small late fee may apply.</Text> }]} />,
      },
      { name: "QrCode", id: "functional-qrcode", purpose: "Hand a link to another device.", example: <div className={styles.qr}><QrCode value="https://example.com" label="Scan to continue" /></div> },
    ],
  },
  {
    title: "Text and icons",
    intro: "The smallest units of content. Size and colour come from the theme.",
    entries: [
      { name: "Heading", id: "functional-primitives-heading", purpose: "h1 to h6, sized by level.", example: <Heading level={3}>Dues period</Heading> },
      { name: "Text", id: "functional-primitives-text", purpose: "Body copy, labels and captions.", example: <VStack gap="xxs"><Text>Your next return is due 28 November.</Text><Text tone="secondary">Updated today</Text></VStack> },
      { name: "Code", id: "functional-primitives-code", purpose: "Identifiers, paths and commands.", example: <Code>npx @squonkstack/ui</Code> },
      { name: "Kbd", id: "functional-primitives-kbd", purpose: "A key to press.", example: <Text>Press <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd></Text> },
      { name: "Icon", id: "functional-primitives-icon", purpose: "A curated set of icons with meaningful names.", example: <Cluster gap="sm"><SearchIcon size="control" /><SettingsIcon size="control" /><HelpIcon size="control" /><StarIcon size="control" /></Cluster> },
    ],
  },
  {
    title: "Layout: page structure",
    intro: "The outline of a screen. Most screens are a page, then sections of cards.",
    entries: [
      { name: "Page", id: "layout-page", purpose: "The full-screen <main> shell of an app screen.", example: <Text tone="secondary">Wraps a whole screen, so it isn't shown here. See the Examples.</Text> },
      { name: "Container", id: "layout-primitives-container", purpose: "Cap content width and centre it.", example: <Container size="mobile"><Block background="subtle" padding="xs"><Text>Capped width</Text></Block></Container> },
      { name: "Section", id: "layout-section", purpose: "A band of page content with room around it.", example: <Section tone="subtle" register="compact"><Text>A section</Text></Section> },
      { name: "Section Heading", id: "layout-section-heading", purpose: "Eyebrow, headline and a supporting line.", example: <SectionHeading eyebrow="Accounts" headline="Your dues" level={3} align="start" /> },
      { name: "Split", id: "layout-split", purpose: "A leading and a trailing group on one row.", example: <Split><Text weight="bold">Annual dues</Text><Badge tone="success">Paid</Badge></Split> },
    ],
  },
  {
    title: "Layout: surfaces",
    intro: "Panels that hold content.",
    entries: [
      { name: "Card", id: "layout-card", purpose: "Related content on a surface.", example: <Card variant="outlined"><Text>Annual dues: up to date</Text></Card> },
      { name: "Interactive Card", id: "layout-interactive-card", purpose: "A whole card that's a link or a button.", example: <InteractiveCard as="a" href="#" variant="outlined"><Text weight="bold">File a return</Text></InteractiveCard> },
      { name: "Block", id: "layout-primitives-block", purpose: "Padding, background or a border without a name.", example: <Block padding="sm" background="subtle" radius="base"><Text>A plain block</Text></Block> },
      { name: "Media Object", id: "layout-media-object", purpose: "Media beside content.", example: <MediaObject media={<Avatar name="Aroha Ngata" />}><Text weight="bold">Aroha Ngata</Text><Text tone="secondary">Case officer</Text></MediaObject> },
    ],
  },
  {
    title: "Layout: stacks and grids",
    intro: "Arrange things. These take layout props such as gap, so the components inside don't need to.",
    entries: [
      { name: "VStack", id: "layout-primitives-vstack", purpose: "A column with a gap.", example: <VStack gap="xs"><Badge>One</Badge><Badge>Two</Badge></VStack> },
      { name: "HStack", id: "layout-primitives-hstack", purpose: "A row with a gap and alignment.", example: <HStack gap="xs"><Badge>One</Badge><Badge>Two</Badge></HStack> },
      { name: "Inline", id: "layout-primitives-inline", purpose: "Small items in the flow of text.", example: <Text>Due <Inline gap="xxs"><Badge tone="warning">Soon</Badge></Inline> this week</Text> },
      { name: "Cluster", id: "layout-cluster", purpose: "A wrapping row of small items.", example: <Cluster gap="xs">{["Dues", "Levy", "Kit hire", "Deposit"].map((t) => <Tag key={t}>{t}</Tag>)}</Cluster> },
      { name: "Grid", id: "layout-primitives-grid", purpose: "A responsive grid of columns.", example: <Grid columns={3} gap="xs">{[1, 2, 3].map((n) => <Block key={n} background="subtle" padding="xs"><Text>{n}</Text></Block>)}</Grid> },
      { name: "Spacer", id: "layout-primitives-spacer", purpose: "Push siblings apart.", example: <HStack><Text>Start</Text><Spacer /><Text>End</Text></HStack> },
      { name: "Centered", id: "layout-primitives-centered", purpose: "Centre on both axes.", example: <Centered minHeight="64px"><Text>Centred</Text></Centered> },
      { name: "AspectRatio", id: "layout-primitives-aspectratio", purpose: "Keep a width-to-height ratio.", example: <AspectRatio ratio="16 / 9"><Block background="subtle" padding="xs"><Text>16:9</Text></Block></AspectRatio> },
      { name: "ScrollBox", id: "layout-primitives-scrollbox", purpose: "Scroll a region that's too big.", example: <ScrollBox maxHeight="64px"><Text>One</Text><Text>Two</Text><Text>Three</Text><Text>Four</Text><Text>Five</Text></ScrollBox> },
      { name: "Divider", id: "layout-primitives-divider", purpose: "A rule between sibling content.", example: <VStack gap="xs"><Text>Above</Text><Divider /><Text>Below</Text></VStack> },
    ],
  },
  {
    title: "Theme and motion",
    intro: "Change the theme for part of a page, or bring content in gently.",
    entries: [
      { name: "Presentation", id: "style-presentation", purpose: "Set a register: compact, default, large or hero.", example: <HStack gap="xs" align="center"><Presentation register="compact"><Button>Compact</Button></Presentation><Button>Default</Button></HStack> },
      { name: "Theme Modifier", id: "style-theme-modifier", purpose: "Override theme values for a subtree.", example: <ThemeModifier override={{ roleBindings: { "roles.radius.control": "borders.radius.none" } }}><Button>Square here</Button></ThemeModifier> },
      { name: "Theme Style Block", id: "style-theme-style-block", purpose: "Flip light and dark, or change register, for a block.", example: <ThemeStyleBlock invertMode><Block background="default" padding="sm"><Text>Inverted</Text></Block></ThemeStyleBlock> },
      { name: "Motion", id: "animation-motion", purpose: "The library's motion, including Reveal for content arriving on scroll.", example: <Motion.Reveal><span><Text>Fades in once</Text></span></Motion.Reveal> },
    ],
  },
];

/** Every entry's docs id, so a test can check each one exists. */
export const galleryDocsIds = groups.flatMap((g) => g.entries.map((e) => `${e.id}--docs`));

/**
 * Every component, grouped as in the sidebar, each with a small live
 * example, its job in one line and a link to its page.
 */
export function ComponentGallery() {
  return (
    <ToastProvider>
      <DocsNavigation>
      <div className={styles.root}>
        {groups.map((group) => (
          <section key={group.title} className={styles.group} aria-labelledby={`gallery-${group.title}`}>
            <h2 id={`gallery-${group.title}`} className={styles.groupTitle}>{group.title}</h2>
            <p className={styles.intro}>{group.intro}</p>
            <ul className={styles.grid}>
              {group.entries.map((entry) => (
                <li key={entry.id} className={styles.card}>
                  <div className={styles.example}>{entry.example}</div>
                  <div className={styles.text}>
                    <Link className={styles.name} href={docsHref(`${entry.id}--docs`)} underline="hover">
                      {entry.name}
                    </Link>
                    <span className={styles.purpose}>{entry.purpose}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      </DocsNavigation>
    </ToastProvider>
  );
}
