"use client";

import { useState } from "react";
import Link from "next/link";

function statusLabel(status) {
  return status === "in_store" ? "In Store" : "Not In Store";
}

function statusBadgeClass(status) {
  return status === "in_store"
    ? "bg-[#8B7CD8]/10 text-[#6555B6] border-[#8B7CD8]/25"
    : "bg-gray-100 text-gray-700 border-gray-200";
}

function DeleteModal({ collection, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete collection?</h3>
        <p className="text-sm text-gray-600 mb-5">
          <span className="font-medium text-gray-900">"{collection.name}"</span> will be removed from the catalog and its product links will be cleared. This cannot be undone.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 shadow-xs"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionsList({ initialCollections }) {
  const [collections, setCollections] = useState(initialCollections);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const filtered = collections.filter((collection) => {
    const q = search.toLowerCase();
    return (
      collection.name.toLowerCase().includes(q) ||
      statusLabel(collection.status).toLowerCase().includes(q)
    );
  });

  async function handleDeleteConfirm() {
    if (!toDelete) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/collections/${toDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete collection");
      }

      setCollections((prev) => prev.filter((item) => item.id !== toDelete.id));
      setToDelete(null);
    } catch (error) {
      setDeleteError(error.message || "Could not delete the collection. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {toDelete && (
        <DeleteModal
          collection={toDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setToDelete(null);
            setDeleteError("");
          }}
          isDeleting={isDeleting}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {filtered.length} / {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </span>
        </div>

        {deleteError && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">{deleteError}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Collection</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Products</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                    {search ? "No collections match your search." : "No collections yet. Add one to get started."}
                  </td>
                </tr>
              ) : (
                filtered.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {collection.image ? (
                          <img
                            src={collection.image}
                            alt={collection.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            </svg>
                          </div>
                        )}

                        <div>
                          <span className="font-semibold text-gray-900 leading-tight block">{collection.name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(collection.createdAt).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(collection.status)}`}>
                        {statusLabel(collection.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium">
                        {collection.products?.length ?? 0} product{(collection.products?.length ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/collections/${collection.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition border border-gray-200"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setToDelete(collection)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
