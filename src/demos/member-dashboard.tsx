import React from "react";
import { z } from "zod";
import {
  Alert,
  Badge,
  Button,
  Card,
  Cluster,
  Currency,
  DropdownMenu,
  Grid,
  IconButton,
  InfiniteList,
  Link,
  Modal,
  Motion,
  Popover,
  ScrollBox,
  Select,
  Table,
  Tabs,
  Tag,
  TagGroup,
  Text,
  VStack,
  toMinorUnits,
  useToast,
} from "../components";
import type { TableColumn } from "../components";
import { useAppForm } from "../components/functional/form/form";
import { InfoIcon, MoreIcon, PrintIcon } from "../components/functional-primitive/icon/icon";
import { ACCOUNTS, activity, money, nz, SIGHTINGS, shortDate, STATUS_LABEL, STATUS_TONE, type Activity, type MembershipAccount, type SightingReport } from "./fixtures";
import { Stat, SocietyAppShell } from "./demo-shell";
import styles from "./demos.module.css";

const owing = ACCOUNTS.filter((a) => a.balance > 0);
// Add money up in cents, never as floats.
const totalOwingCents = owing.reduce((sum, a) => sum + toMinorUnits(a.balance, 2), 0);

const paymentSchema = z.object({
  account: z.string().min(1, "Choose what you are paying"),
  amount: z.number({ error: "Enter how much you are paying" }).positive("Enter an amount more than $0"),
  method: z.string().min(1, "Choose how you will pay"),
});

function PaymentForm({ account, onDone }: { account?: string; onDone: (message: string) => void }) {
  const form = useAppForm({
    defaultValues: { account: account ?? "", amount: null as number | null, method: "" },
    validators: { onChange: paymentSchema },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const fee = ACCOUNTS.find((a) => a.id === value.account)?.fee ?? "your account";
      onDone(`${money(value.amount ?? 0)} towards ${fee} will show within 2 working days.`);
    },
  });
  return (
    <form.AppForm>
      <form.Form aria-label="Make a payment">
        <form.ErrorSummary />
        <form.AppField name="account">
          {(field) => (
            <field.Select
              label="What are you paying?"
              placeholder="Choose a membership account"
              options={owing.map((a) => ({ value: a.id, label: `${a.fee}, ${a.period}`, description: `${money(a.balance)} to pay` }))}
            />
          )}
        </form.AppField>
        <form.AppField name="amount">
          {(field) => <field.CurrencyField {...nz} label="Amount" helperText="You can pay part now and the rest later." />}
        </form.AppField>
        <form.AppField name="method">
          {(field) => (
            <field.RadioGroup
              legend="How will you pay?"
              options={[
                { value: "card", label: "Debit or credit card", helperText: "A 1.42% fee applies" },
                { value: "bank", label: "Internet banking" },
                { value: "debit", label: "Direct debit from your bank account" },
              ]}
            />
          )}
        </form.AppField>
        <div className={styles.formActions}>
          <form.SubmitButton pendingLabel="Paying…">Continue to payment</form.SubmitButton>
        </div>
      </form.Form>
    </form.AppForm>
  );
}

function AccountsTable({ onPay }: { onPay: (account: string) => void }) {
  const columns: TableColumn<MembershipAccount>[] = [
    { key: "fee", header: "Fee", render: (a) => <VStack gap="none"><Text weight="bold">{a.fee}</Text><Text tone="secondary">{a.period}</Text></VStack>, sortValue: (a) => a.fee },
    { key: "due", header: "Due", render: (a) => shortDate(a.due), sortValue: (a) => a.due },
    { key: "status", header: "Status", render: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge> },
    { key: "balance", header: "Balance", align: "right", render: (a) => <Currency {...nz} value={a.balance} />, sortValue: (a) => a.balance },
    {
      key: "actions",
      header: <span className={styles.visuallyHidden}>Actions</span>,
      width: "56px",
      render: (a) => (
        <DropdownMenu
          align="end"
          triggerLabel={`Actions for ${a.fee}`}
          trigger={<MoreIcon size="control" />}
          items={[
            { key: "pay", label: "Make a payment", disabled: a.balance <= 0, onSelect: () => onPay(a.id) },
            { key: "statement", label: "View statement" },
            { key: "arrangement", label: "Set up an instalment plan", disabled: a.status !== "overdue" },
          ]}
        />
      ),
    },
  ];
  return <Table caption="Membership accounts" columns={columns} rows={ACCOUNTS} rowKey="id" />;
}

function SightingsTable() {
  const [kinds, setKinds] = React.useState<string[]>(["Tear trail", "Tear pool"]);
  const [status, setStatus] = React.useState("");
  const rows = SIGHTINGS.filter((r) => kinds.includes(r.kind) && (!status || r.status === status));
  const columns: TableColumn<SightingReport>[] = [
    { key: "period", header: "Period", sortable: true },
    { key: "kind", header: "Kind", sortable: true },
    { key: "logged", header: "Logged", sortable: true, render: (r) => shortDate(r.logged), sortValue: (r) => r.logged },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Under review" ? "info" : r.status === "Corrected" ? "warning" : "neutral"}>{r.status}</Badge> },
    { key: "amount", header: "Tear volume (mL)", align: "right", sortable: true, render: (r) => r.amount.toLocaleString("en-NZ"), sortValue: (r) => r.amount },
  ];
  return (
    <VStack gap="md">
      <div className={styles.filterBar}>
        <Cluster gap="xs" align="center">
          <Text as="span" tone="secondary">Showing</Text>
          {/* Tags glide into place as one is removed or comes back. */}
          <Motion.Layout items="[role=row]">
            <TagGroup aria-label="Kinds shown">
              {kinds.map((kind) => (
                <Tag key={kind} tone="primary" onRemove={kinds.length > 1 ? () => setKinds((t) => t.filter((x) => x !== kind)) : undefined}>{kind}</Tag>
              ))}
            </TagGroup>
          </Motion.Layout>
          {/* The way back joins once a kind is filtered out, and leaves after. */}
          <Motion.Presence show={kinds.length < 2} from="start">
            <Button variant="ghost" onClick={() => setKinds(["Tear trail", "Tear pool"])}>Show all kinds</Button>
          </Motion.Presence>
        </Cluster>
        <Select
          label="Status"
          fullWidth={false}
          clearable
          placeholder="Any status"
          value={status}
          onChange={setStatus}
          options={["Verified", "Under review", "Corrected"].map((s) => ({ value: s, label: s }))}
        />
      </div>
      <Table caption="Logged sightings" columns={columns} rows={rows} rowKey="id" pageSize={8} defaultSort={{ key: "logged", direction: "desc" }} striped empty="No sightings match these filters." />
    </VStack>
  );
}

function ActivityFeed() {
  const [items, setItems] = React.useState<Activity[]>(() => Array.from({ length: 10 }, (_, i) => activity(i)));
  const [loading, setLoading] = React.useState(false);
  const total = 60;
  return (
    <ScrollBox maxHeight="440px" className={styles.feedBox}>
      <InfiniteList
        aria-label="Account activity"
        items={items}
        total={total}
        hasMore={items.length < total}
        loading={loading}
        onLoadMore={() => {
          setLoading(true);
          setTimeout(() => {
            setItems((current) => [...current, ...Array.from({ length: 10 }, (_, i) => activity(current.length + i))]);
            setLoading(false);
          }, 700);
        }}
        getKey={(item) => item.id}
        renderItem={(item) => (
          <div className={styles.feedRow}>
            <div>
              <h3 className={styles.feedTitle}>{item.title}</h3>
              <Text tone="secondary">{item.detail}</Text>
            </div>
            <VStack gap="xxs" align="end">
              <Badge tone={item.tone}>{item.tone === "success" ? "Paid" : item.tone === "warning" ? "Reminder" : "Update"}</Badge>
              <Text tone="secondary" as="span">{item.when}</Text>
            </VStack>
          </div>
        )}
      />
    </ScrollBox>
  );
}

function DashboardBody() {
  const toast = useToast();
  const [paying, setPaying] = React.useState<{ account?: string } | null>(null);
  const [notice, setNotice] = React.useState(true);
  return (
    <VStack gap="lg">
      {/* Dismissing the notice lets it leave rather than vanish. */}
      <Motion.Presence show={notice} from="above">
        <Alert tone="error" title="Your annual dues are overdue" onDismiss={() => setNotice(false)}>
          <Currency {...nz} value={148.2} /> for the 2026–27 season was due on 28 September. Pay now or{" "}
          <Link href="#instalment-plans">set up a dues instalment plan</Link> to stop further late fees.
        </Alert>
      </Motion.Presence>

      {/* The summary cards arrive one after another. */}
      <Grid columns={{ mobile: 1, tablet: 3 }} gap="md">
        <Motion.Stagger>
          <Motion.Presence show playOnMount>
            <Card variant="outlined">
              <VStack gap="sm">
                <Cluster gap="xxs" align="center">
                  <Stat label="Total to pay" value={<Currency {...nz} value={totalOwingCents} minorUnits />} />
                  <Popover
                    size="sm"
                    title="What's included"
                    trigger={<IconButton icon={<InfoIcon />} label="What's included in your total" tooltip={false} />}
                  >
                    <ul className={styles.plainList}>
                      {owing.map((a) => (
                        <li key={a.id} className={styles.lineItem}><span>{a.fee}, {a.period}</span><Currency {...nz} value={a.balance} /></li>
                      ))}
                    </ul>
                    <Text tone="secondary">Includes late fees to today.</Text>
                  </Popover>
                </Cluster>
                <Button variant="primary" onClick={() => setPaying({})}>Make a payment</Button>
              </VStack>
            </Card>
          </Motion.Presence>
          <Motion.Presence show playOnMount>
            <Card variant="outlined">
              <VStack gap="sm">
                <Stat label="Next due" value="20 Nov" />
                <Text tone="secondary">Swamp Fund levy for spring, <Currency {...nz} value={62.14} /></Text>
              </VStack>
            </Card>
          </Motion.Presence>
          <Motion.Presence show playOnMount>
            <Card variant="outlined">
              <VStack gap="sm">
                <Stat label="Credit available" value={<Currency {...nz} value={31.24} />} />
                <Link href="#credit">Choose how to use it</Link>
              </VStack>
            </Card>
          </Motion.Presence>
        </Motion.Stagger>
      </Grid>

      <Card variant="outlined">
        <Tabs
          listLabel="Your account"
          items={[
            { value: "accounts", label: "Membership accounts", content: <AccountsTable onPay={(account) => setPaying({ account })} /> },
            { value: "sightings", label: "Sightings", badge: <Badge tone="info">{SIGHTINGS.length}</Badge>, content: <SightingsTable /> },
            { value: "activity", label: "Activity", content: <ActivityFeed /> },
          ]}
          lazy
        />
      </Card>

      <Modal open={paying !== null} onClose={() => setPaying(null)} title="Make a payment">
        {paying ? (
          <PaymentForm
            account={paying.account}
            onDone={(message) => {
              setPaying(null);
              toast.success(message, "Payment started");
            }}
          />
        ) : null}
      </Modal>
    </VStack>
  );
}

/** A member's account overview: balances, accounts, sightings and activity. */
export function MemberDashboard() {
  return (
    <SocietyAppShell
      active="Overview"
      crumbs={[{ label: "My account", href: "#account" }, { label: "Overview" }]}
      title="Kia ora, Aroha"
      description="Waikato Chapter · last signed in 2 November"
      actions={<IconButton variant="secondary" icon={<PrintIcon />} label="Print this page" onClick={() => window.print()} />}
    >
      <DashboardBody />
    </SocietyAppShell>
  );
}
