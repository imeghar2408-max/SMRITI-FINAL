import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  Video,
  Heart,
  UserPlus,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";

const initialContacts = [
  {
    id: 1,
    name: "Priya Sharma",
    relation: "Daughter",
    phone: "+91 98765 43210",
    preferred: "Video Call",
    lastContact: "Today, 10:30 AM",
    status: "Available",
  },
  {
    id: 2,
    name: "Rahul Sharma",
    relation: "Grandson",
    phone: "+91 98765 22110",
    preferred: "Call",
    lastContact: "Yesterday, 6:15 PM",
    status: "Available",
  },
  {
    id: 3,
    name: "Anil Sharma",
    relation: "Husband",
    phone: "+91 98765 11882",
    preferred: "Call",
    lastContact: "Yesterday, 8:00 PM",
    status: "Offline",
  },
];

function FamilySocial({ setCurrentView }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetch("/api/patient/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p && p.familyContact) {
          setContacts((prev) => {
            if (prev.some((c) => c.name === p.familyContact)) return prev;
            return [
              {
                id: Date.now(),
                name: p.familyContact,
                relation: p.familyRelation || "Family",
                phone: "+91 98765 43210",
                preferred: "Video Call",
                lastContact: "Today",
                status: "Available",
              },
              ...prev,
            ];
          });
        }
      })
      .catch((e) => console.warn(e));
  }, []);

  const [newContact, setNewContact] = useState({
    name: "",
    relation: "",
    phone: "",
    preferred: "Call",
  });

  const availableCount = contacts.filter((c) => c.status === "Available").length;

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.relation || !newContact.phone) return;

    const contact = {
      id: Date.now(),
      name: newContact.name,
      relation: newContact.relation,
      phone: newContact.phone,
      preferred: newContact.preferred,
      lastContact: "Just added",
      status: "Available",
    };

    setContacts((prev) => [contact, ...prev]);
    setNewContact({
      name: "",
      relation: "",
      phone: "",
      preferred: "Call",
    });
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7FC] dark:bg-[#11121C] p-6 transition-colors">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">
              Family & Social Circle
            </h1>
            <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
              Help Asha stay connected with familiar people.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-sm font-semibold text-white shadow-soft transition"
        >
          <Plus size={16} />
          Add Family Member
        </button>
      </div>

      {/* PATIENT CONTEXT */}
      <div className="mb-6 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-2xl border border-[#6366D8]/20">
          👵
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">Asha</h2>
          <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Family and social support network</p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Family Members"
          value={contacts.length}
          text="Trusted contacts"
          icon={<Users size={18} />}
        />
        <SummaryCard
          title="Available Now"
          value={availableCount}
          text="Ready to connect"
          icon={<CheckCircle2 size={18} className="text-[#78CFA3]" />}
        />
        <SummaryCard
          title="Today's Interactions"
          value="3"
          text="Calls and messages"
          icon={<MessageCircle size={18} className="text-[#6366D8]" />}
        />
        <SummaryCard
          title="Social Engagement"
          value="87%"
          text="This week"
          icon={<Heart size={18} className="text-[#E98B9B]" />}
        />
      </div>

      {/* CONTACTS GRID */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
          Family & Trusted Contacts
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-xl">
                    👤
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#202238] dark:text-[#F3F4F6]">
                      {contact.name}
                    </h3>
                    <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">{contact.relation}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    contact.status === "Available"
                      ? "bg-[#78CFA3]/15 text-[#78CFA3]"
                      : "bg-stone-100 dark:bg-stone-800 text-[#6B6E85]"
                  }`}
                >
                  {contact.status}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-stone-100 dark:border-stone-800 pt-3 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                <div className="flex items-center justify-between">
                  <span>Phone:</span>
                  <span className="font-semibold text-[#202238] dark:text-[#F3F4F6]">{contact.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Preferred:</span>
                  <span className="font-semibold text-[#6366D8] dark:text-[#8B8FE8]">{contact.preferred}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last contact:</span>
                  <span>{contact.lastContact}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => alert(`Calling ${contact.name} at ${contact.phone}...`)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] py-2 text-xs font-semibold text-white transition shadow-soft"
                >
                  <Phone size={13} />
                  <span>Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Starting video session with ${contact.name}...`)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#E8E8FA] dark:bg-[#25283C] hover:bg-[#6366D8]/20 py-2 text-xs font-semibold text-[#6366D8] dark:text-[#8B8FE8] transition"
                >
                  <Video size={13} />
                  <span>Video</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1B1D2A] p-7 shadow-2xl border border-stone-200/80 dark:border-stone-800/80">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#202238] dark:text-[#F3F4F6]">
                Add Family Contact
              </h2>
              <button onClick={() => setShowAddForm(false)} className="text-[#6B6E85]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  value={newContact.relation}
                  onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                  placeholder="e.g. Son, Sister"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Preferred Method
                </label>
                <select
                  value={newContact.preferred}
                  onChange={(e) => setNewContact({ ...newContact, preferred: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                >
                  <option value="Call">Phone Call</option>
                  <option value="Video Call">Video Call</option>
                  <option value="Message">Message</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] py-3 text-sm font-semibold text-[#6B6E85] dark:text-[#C5C8D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] py-3 text-sm font-semibold text-white shadow-soft transition"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, text, icon }) {
  return (
    <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#6B6E85] dark:text-[#9A9DB5]">{title}</p>
        <div className="text-[#6366D8] dark:text-[#8B8FE8]">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">{value}</p>
      <p className="mt-1 text-xs text-[#6B6E85]/80 dark:text-[#9A9DB5]/80">{text}</p>
    </div>
  );
}

export default FamilySocial;
