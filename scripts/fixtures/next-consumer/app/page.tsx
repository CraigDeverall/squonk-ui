import { Button } from "@squonk/ui";
import { TextField } from "@squonk/ui/text-field";
import { Select } from "@squonk/ui/select";

// Root and leaf imports must both be consumable without a local "use client".
export default function Page() {
  return <main>
    <Button>Root import</Button>
    <TextField label="Packed input" name="example" />
    <Select label="Packed select" options={[{ value: "one", label: "One" }]} />
  </main>;
}
