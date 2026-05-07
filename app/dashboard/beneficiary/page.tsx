"use client"

import { FormEvent, useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Beneficiary = {
  id: number
  name: string
  birthDate: string
  gender: string
  address: string
  faydaId: string
  source: "Fayda" | "Manual"
}

const PAGE_SIZE = 5

export default function BeneficiaryPage() {
  const [rows, setRows] = useState<Beneficiary[]>([
    {
      id: 1,
      name: "Amina Yusuf",
      birthDate: "1998-03-12",
      gender: "Female",
      address: "Addis Ababa",
      faydaId: "FD-10004502",
      source: "Fayda",
    },
    {
      id: 2,
      name: "Hassan Ali",
      birthDate: "1987-11-20",
      gender: "Male",
      address: "Dire Dawa",
      faydaId: "N/A",
      source: "Manual",
    },
  ])

  const [page, setPage] = useState(1)
  const [openFayda, setOpenFayda] = useState(false)
  const [openManual, setOpenManual] = useState(false)

  const [faydaId, setFaydaId] = useState("")
  const [manualForm, setManualForm] = useState({
    name: "",
    birthDate: "",
    gender: "",
    address: "",
  })

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [page, rows])

  function onAddWithFayda(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!faydaId.trim()) return

    const nextItem: Beneficiary = {
      id: Date.now(),
      name: "Fetched from Fayda",
      birthDate: "2000-01-01",
      gender: "Unknown",
      address: "Pending verification",
      faydaId: faydaId.trim(),
      source: "Fayda",
    }

    setRows((prev) => [nextItem, ...prev])
    setPage(1)
    setFaydaId("")
    setOpenFayda(false)
  }

  function onAddManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!manualForm.name || !manualForm.birthDate || !manualForm.gender || !manualForm.address) return

    const nextItem: Beneficiary = {
      id: Date.now(),
      name: manualForm.name,
      birthDate: manualForm.birthDate,
      gender: manualForm.gender,
      address: manualForm.address,
      faydaId: "N/A",
      source: "Manual",
    }

    setRows((prev) => [nextItem, ...prev])
    setPage(1)
    setManualForm({ name: "", birthDate: "", gender: "", address: "" })
    setOpenManual(false)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-4xl tracking-tight text-black">Beneficiary</h1>
          <p className="mt-1 text-sm text-black/60">Manage beneficiaries from Fayda or manual registration.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={openFayda} onOpenChange={setOpenFayda}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus />
                Add with Fayda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Beneficiary with Fayda</DialogTitle>
                <DialogDescription>Provide a Fayda ID number to import beneficiary details.</DialogDescription>
              </DialogHeader>
              <form onSubmit={onAddWithFayda} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fayda-id">Fayda ID Number</Label>
                  <Input
                    id="fayda-id"
                    value={faydaId}
                    onChange={(event) => setFaydaId(event.target.value)}
                    placeholder="FD-XXXXXXXX"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Add Beneficiary</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openManual} onOpenChange={setOpenManual}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                Add manually
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Beneficiary Manually</DialogTitle>
                <DialogDescription>Enter basic individual details to create a beneficiary record.</DialogDescription>
              </DialogHeader>
              <form onSubmit={onAddManual} className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Full name</Label>
                  <Input
                    id="manual-name"
                    value={manualForm.name}
                    onChange={(event) =>
                      setManualForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="e.g. Abebe Kebede"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-birthdate">Birth date</Label>
                  <Input
                    id="manual-birthdate"
                    type="date"
                    value={manualForm.birthDate}
                    onChange={(event) =>
                      setManualForm((prev) => ({ ...prev, birthDate: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-gender">Gender</Label>
                  <Input
                    id="manual-gender"
                    value={manualForm.gender}
                    onChange={(event) =>
                      setManualForm((prev) => ({ ...prev, gender: event.target.value }))
                    }
                    placeholder="Male / Female / Other"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-address">Address</Label>
                  <Input
                    id="manual-address"
                    value={manualForm.address}
                    onChange={(event) =>
                      setManualForm((prev) => ({ ...prev, address: event.target.value }))
                    }
                    placeholder="City, sub-city, kebele"
                    required
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="submit">Save Beneficiary</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm shadow-black/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Birth date</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Fayda ID</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.birthDate}</TableCell>
                <TableCell>{item.gender}</TableCell>
                <TableCell>{item.address}</TableCell>
                <TableCell>{item.faydaId}</TableCell>
                <TableCell>{item.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-black/60">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
          </p>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                  Previous
                </PaginationPrevious>
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink isActive={pageNumber === page} onClick={() => setPage(pageNumber)}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </section>
  )
}
