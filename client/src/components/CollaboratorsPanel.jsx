import { useState } from "react";
import useDiagramStore from "../store/useDiagramStore";

const ROLE_COLORS = {
  owner: "#F2A93B",
  editor: "#2FB8AC",
  viewer: "#8D99AE",
};

export default function CollaboratorsPanel() {
  const {
    owner,
    collaborators,
    collaboratorsOnline,
    user,

    canInvite,
    canManagePermissions,

    inviteCollaborator,
    removeCollaborator,
    updateCollaboratorPermission,
  } = useDiagramStore();

  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");
  const [status, setStatus] = useState("");

  async function handleInvite(e) {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      await inviteCollaborator(email.trim(), permission);

      setEmail("");
      setPermission("viewer");
      setStatus("");
    } catch (err) {
      console.log('collaborator invite error', err);
      
      setStatus(
        err.response?.data?.error ??
          "Unable to invite collaborator."
      );
    }
  }

  const people = [
    ...(owner
      ? [
          {
            _id: owner._id,
            name: owner.name,
            email: owner.email,
            permission: "owner",
          },
        ]
      : []),

    ...collaborators.map((c) => ({
      _id: c.user._id,
      name: c.user.name,
      email: c.user.email,
      permission: c.permission,
    })),
  ];

  function online(person) {
    return (
      person._id === user?.id ||
      collaboratorsOnline.includes(person._id)
    );
  }

  return (
    <section>

      <div className="mb-3 flex items-center justify-between">

        <p className="spec-plate text-blueprint-line">
          05 / collaborators
        </p>

        <span className="text-[10px] text-paper/40">
          {people.filter(online).length}/{people.length} online
        </span>

      </div>

      <ul className="space-y-2">

        {people.map((person) => {

          const isOwner = person.permission === "owner";

          return (
            <li
              key={person._id}
              className="rounded border border-blueprint-line/20 bg-blueprint-800/50 p-2"
            >

              <div className="flex items-center justify-between">

                <div className="min-w-0">

                  <div className="flex items-center gap-2">

                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: online(person)
                          ? "#2FB8AC"
                          : "#555",
                      }}
                    />

                    <span className="truncate text-xs">

                      {person.name}

                      {person._id === user?.id && (
                        <span className="text-paper/40">
                          {" "}
                          (You)
                        </span>
                      )}

                    </span>

                  </div>

                  <p className="truncate text-[10px] text-paper/40">
                    {person.email}
                  </p>

                </div>

                <div className="flex items-center gap-2">

                  {isOwner ? (
                    <span
                      className="rounded px-2 py-1 text-[10px] uppercase"
                      style={{
                        background: ROLE_COLORS.owner + "22",
                        color: ROLE_COLORS.owner,
                      }}
                    >
                      Owner
                    </span>
                  ) : canManagePermissions ? (
                    <select
                      value={person.permission}
                      onChange={(e) =>
                        updateCollaboratorPermission(
                          person._id,
                          e.target.value
                        )
                      }
                      className="rounded border border-blueprint-line/30 bg-blueprint-900 px-2 py-1 text-[10px]"
                    >
                      <option value="viewer">
                        Viewer
                      </option>

                      <option value="editor">
                        Editor
                      </option>

                    </select>
                  ) : (
                    <span
                      className="rounded px-2 py-1 text-[10px]"
                      style={{
                        background: ROLE_COLORS[person.permission] + "22",
                        color: ROLE_COLORS[person.permission],
                      }}
                    >
                      {person.permission}
                    </span>
                  )}

                  {canInvite && !isOwner && (
                    <button
                      onClick={() =>
                        removeCollaborator(person._id)
                      }
                      className="text-[10px] text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}

                </div>

              </div>

            </li>
          );
        })}

      </ul>

      {canInvite && (

        <form
          onSubmit={handleInvite}
          className="mt-4 space-y-2"
        >

          <input
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Email address"
            className="w-full rounded border border-blueprint-line/30 bg-blueprint-800 p-2 text-xs"
          />

          <select
            value={permission}
            onChange={(e) =>
              setPermission(e.target.value)
            }
            className="w-full rounded border border-blueprint-line/30 bg-blueprint-800 p-2 text-xs"
          >
            <option value="viewer">
              Viewer
            </option>

            <option value="editor">
              Editor
            </option>

          </select>

          <button
            className="w-full rounded border border-amber px-3 py-2 text-xs text-amber hover:bg-amber/10"
          >
            Invite Collaborator
          </button>

          {status && (
            <p className="text-xs text-red-400">
              {status}
            </p>
          )}

        </form>

      )}

    </section>
  );
}