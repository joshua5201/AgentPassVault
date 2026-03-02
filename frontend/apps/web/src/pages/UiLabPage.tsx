import { useState } from "react";
import { Badge, Button, Card, Input, Modal, Select, Tabs, Textarea, Toast } from "../components/ui";

export function UiLabPage() {
  const [activeTab, setActiveTab] = useState("components");
  const [openModal, setOpenModal] = useState(false);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">UI Lab</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Internal showcase for reusable components and form patterns.
        </p>
      </header>

      <Tabs
        tabs={[
          { id: "components", label: "Components" },
          { id: "feedback", label: "Feedback" },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "components" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Buttons & Badges">
            <div className="flex flex-wrap items-center gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Badge tone="success">fulfilled</Badge>
              <Badge tone="warning">pending</Badge>
            </div>
          </Card>

          <Card title="Form Controls">
            <div className="space-y-3">
              <Input label="Secret Name" placeholder="AWS Production Credentials" hint="Human-readable display name." />
              <Select label="Lease Policy" defaultValue="expires">
                <option value="permanent">Permanent</option>
                <option value="expires">Expires</option>
              </Select>
              <Textarea label="Context" placeholder="Why this secret is needed..." />
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "feedback" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Toast Variants">
            <div className="space-y-2">
              <Toast title="Request queued">The request is now pending human review.</Toast>
              <Toast tone="success" title="Request fulfilled">
                Lease generated and linked to secret.
              </Toast>
              <Toast tone="error" title="Lease failed">
                Agent public key is invalid.
              </Toast>
            </div>
          </Card>

          <Card
            title="Modal Example"
            actions={
              <Button size="sm" onClick={() => setOpenModal(true)}>
                Open
              </Button>
            }
          >
            <p className="text-sm text-[var(--color-text-muted)]">
              Use this structure for confirmation or sensitive submit flows.
            </p>
          </Card>
        </div>
      ) : null}

      <Modal
        open={openModal}
        title="Confirm Lease Creation"
        onClose={() => setOpenModal(false)}
        onConfirm={() => setOpenModal(false)}
        confirmLabel="Create lease"
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          This is a visual placeholder for future secure lease creation confirmation.
        </p>
      </Modal>
    </section>
  );
}
