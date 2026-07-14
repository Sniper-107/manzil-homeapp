"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RoomOption {
  id: string;
  name: string;
}

export function RoomSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (roomId: string) => void;
}) {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("rooms").select("id, name").order("name");
      setRooms(data ?? []);
    }
    load();
  }, []);

  async function handleCreateRoom() {
    if (!newRoomName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user!.id)
      .limit(1)
      .maybeSingle();
    if (!membership) return;

    const { data: room, error } = await supabase
      .from("rooms")
      .insert({ household_id: membership.household_id, name: newRoomName.trim() })
      .select("id, name")
      .single();

    if (!error && room) {
      setRooms((prev) => [...prev, room].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(room.id);
      setCreating(false);
      setNewRoomName("");
    }
  }

  if (creating) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="e.g. Kitchen"
          className="input flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreateRoom();
            }
          }}
        />
        <button
          type="button"
          onClick={handleCreateRoom}
          className="text-sm bg-teal text-white rounded-lg px-3 hover:bg-teal-dark transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setCreating(false)}
          className="text-sm text-ink-soft px-2"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__create__") {
          setCreating(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className="input"
    >
      <option value="">No room</option>
      {rooms.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
      <option value="__create__">+ Add new room...</option>
    </select>
  );
}
