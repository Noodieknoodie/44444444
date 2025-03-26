"use client"
import { Users } from "lucide-react"
import type React from "react"
import { useState, useEffect } from 'react';
import { 
  Client, 
  Contract, 
  Payment, 
  Contact,
  CurrentPeriod,
  PaymentStatus
} from '@/app/api';
import api from '@/app/api';
import { 
  formatDate, 
  formatCurrency, 
  formatPercent, 
  formatPaymentSchedule,
  calculateExpectedFee
} from '@/app/utils/formatters';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Client as ClientType } from "@/lib/types"
import { formatCurrency as oldFormatCurrency, formatDate as oldFormatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Trash2, Plus, MapPin, Mail, Phone, Smartphone, Printer } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ClientSnapshotProps {
  client: ClientType
}

// New interface that combines data from multiple API endpoints
interface ClientSnapshot {
  client: Client;
  contract: Contract;
  payments: Payment[];
  contacts: Contact[];
  currentPeriod: CurrentPeriod;
  paymentStatus: PaymentStatus[];
}

export function ClientSnapshotComponent({ clientId }: { clientId: number }) {
  const [data, setData] = useState<ClientSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        // Fetch all required data for the client
        const [
          clientResponse,
          contractResponse,
          paymentsResponse,
          contactsResponse,
          currentPeriodResponse,
          paymentStatusResponse
        ] = await Promise.all([
          api.clients.getClientById(clientId),
          api.contracts.getContracts({ client_id: clientId, is_active: 1 }),
          api.payments.getPayments({ client_id: clientId }),
          api.contacts.getContacts({ client_id: clientId }),
          api.payments.getCurrentPeriod(),
          api.payments.getPaymentStatus({ client_id: clientId })
        ]);

        // Combine the data into the expected structure
        setData({
          client: clientResponse.items[0],
          contract: contractResponse.items[0],
          payments: paymentsResponse.items,
          contacts: contactsResponse.items,
          currentPeriod: currentPeriodResponse,
          paymentStatus: paymentStatusResponse.items
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch client data');
        console.error('Error fetching client data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  // Handle loading state
  if (loading) {
    return <div className="p-4">Loading client data...</div>;
  }

  // Handle error state
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  // Handle no data
  if (!data || !data.client) {
    return <div className="p-4">No client data found</div>;
  }

  const lastPayment = data.payments[0]
  // const [showContacts, setShowContacts] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{data.client.display_name}</h1>
          <div className="mt-1 flex items-center gap-2 text-slate-500">
            <span>{data.contract?.provider || 'No provider'}</span>
            <span className="text-slate-300">•</span>
            <span className="capitalize">{formatPaymentSchedule(data.contract?.payment_schedule)}</span>
            <span className="text-slate-300">•</span>
            <span>Since {oldFormatDate(data.contract?.start_date)}</span>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Contacts</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Contacts</DialogTitle>
              <DialogDescription>View, edit, or delete contacts for {data.client.display_name}.</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="primary">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="primary">Primary</TabsTrigger>
                <TabsTrigger value="authorized">Authorized</TabsTrigger>
                <TabsTrigger value="provider">Provider</TabsTrigger>
              </TabsList>

              <TabsContent value="primary" className="mt-4">
                <ContactPanel
                  contactType="Primary"
                  contacts={data.contacts.filter(c => c.contact_type === 'Primary')}
                />
              </TabsContent>

              <TabsContent value="authorized" className="mt-4">
                <ContactPanel
                  contactType="Authorized"
                  contacts={data.contacts.filter(c => c.contact_type === 'Authorized')}
                />
              </TabsContent>

              <TabsContent value="provider" className="mt-4">
                <ContactPanel
                  contactType="Provider"
                  contacts={data.contacts.filter(c => c.contact_type === 'Provider')}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="h-1 w-full bg-slate-600"></div>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-medium text-slate-900">Contract Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Contract #</span>
                <span className="font-medium text-slate-900">{data.contract?.contract_number || 'No contract'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Provider</span>
                <span className="font-medium text-slate-900">{data.contract?.provider || 'No provider'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Schedule</span>
                <span className="font-medium text-slate-900">
                  {formatPaymentSchedule(data.contract?.payment_schedule)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fee Type</span>
                <span className="font-medium text-slate-900">
                  {data.contract?.rate_type === "fixed" ? "Fixed Fee" : "% of AUM"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rate</span>
                <span className="font-medium text-slate-900">
                  {data.contract?.rate_type === "fixed"
                    ? oldFormatCurrency(data.contract?.rate_amount) + "/period"
                    : `${oldFormatCurrency(data.contract?.rate_amount)}% annually`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="h-1 w-full bg-slate-600"></div>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-medium text-slate-900">Current Status</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Period</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{data.currentPeriod?.period || 'No period'}</span>
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${data.currentPeriod?.paid ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {data.currentPeriod?.paid ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>

              {data.currentPeriod?.missed_periods && data.currentPeriod.missed_periods.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Missing Payments</span>
                  <span className="font-medium text-amber-600">{data.currentPeriod.missed_periods.length}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Payments</span>
                <span className="font-medium text-slate-900">{data.payments.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last 12 Months</span>
                <span className="font-medium text-slate-900">
                  {oldFormatCurrency(data.payments.slice(0, 12).reduce((sum, payment) => sum + payment.amount, 0))}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Average Payment</span>
                <span className="font-medium text-slate-900">
                  {oldFormatCurrency(
                    data.payments.length > 0
                      ? data.payments.reduce((sum, payment) => sum + payment.amount, 0) /
                          data.payments.length
                      : 0,
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="h-1 w-full bg-slate-600"></div>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-medium text-slate-900">Last Payment</h3>

            {lastPayment ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date Received</span>
                  <span className="font-medium text-slate-900">{oldFormatDate(lastPayment.date_received)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Applied Period</span>
                  <span className="font-medium text-slate-900">
                    {Array.isArray(lastPayment.period_applied)
                      ? `${lastPayment.period_applied[0]} - ${lastPayment.period_applied[lastPayment.period_applied.length - 1]}`
                      : lastPayment.period_applied}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">AUM</span>
                  <span className="font-medium text-slate-900">{oldFormatCurrency(lastPayment.aum)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Expected Fee</span>
                  <span className="font-medium text-slate-900">{oldFormatCurrency(lastPayment.expected_fee)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Amount</span>
                  <div className="text-right">
                    <span className="font-medium text-slate-900">{oldFormatCurrency(lastPayment.amount)}</span>
                    {Math.abs(lastPayment.amount - lastPayment.expected_fee) > 3 && (
                      <div
                        className={`text-xs mt-0.5 ${lastPayment.amount > lastPayment.expected_fee ? "text-slate-700" : "text-amber-600"}`}
                      >
                        {lastPayment.amount > lastPayment.expected_fee ? "+" : ""}
                        {oldFormatCurrency(lastPayment.amount - lastPayment.expected_fee)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500">No payment history</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function renderVariance(actual: number, expected: number) {
  const variance = actual - expected
  const variancePercent = (variance / expected) * 100

  if (Math.abs(variance) <= 3) {
    return <span className="font-medium text-slate-900">Within Target*</span>
  }

  if (variance > 0) {
    return (
      <span className="font-medium text-slate-900">
        +{oldFormatCurrency(variance)} Overpaid ({variancePercent.toFixed(2)}%)
      </span>
    )
  }

  return (
    <span className="font-medium text-amber-600">
      {oldFormatCurrency(variance)} Underpaid ({variancePercent.toFixed(2)}%)
    </span>
  )
}

function renderVarianceInline(actual: number, expected: number) {
  const variance = actual - expected
  const variancePercent = (variance / expected) * 100

  if (Math.abs(variance) <= 3) {
    return <span className="text-slate-500">Within Target</span>
  }

  if (variance > 0) {
    return (
      <span className="text-slate-700">
        +{oldFormatCurrency(variance)} ({variancePercent.toFixed(1)}%)
      </span>
    )
  }

  return (
    <span className="text-amber-600">
      {oldFormatCurrency(variance)} ({variancePercent.toFixed(1)}%)
    </span>
  )
}

interface Contact {
  id: string
  name: string
  title: string
  email: string
  officePhone: string
  mobilePhone: string
  fax: string
  address: string
}

interface ContactPanelProps {
  contactType: string
  contacts: Contact[]
}

function ContactPanel({ contactType, contacts: initialContacts }: ContactPanelProps) {
  const [contacts, setContacts] = useState(initialContacts)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)

  const handleAddContact = (contact: Contact) => {
    setContacts([...contacts, contact])
    setIsAddDialogOpen(false)
  }

  const handleEditContact = (updatedContact: Contact) => {
    setContacts(contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c)))
    setIsEditDialogOpen(false)
    setCurrentContact(null)
  }

  const handleDeleteContact = () => {
    if (currentContact) {
      setContacts(contacts.filter((c) => c.id !== currentContact.id))
      setIsDeleteDialogOpen(false)
      setCurrentContact(null)
    }
  }

  const openEditDialog = (contact: Contact) => {
    setCurrentContact(contact)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (contact: Contact) => {
    setCurrentContact(contact)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{contactType} Contacts</h3>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add Contact</span>
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-slate-500">No contacts found</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {contactType} Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{contact.name}</h4>
                    <p className="text-sm text-slate-500">{contact.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(contact)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => openDeleteDialog(contact)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-600">{contact.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${contact.email}`} className="text-slate-600 hover:text-slate-900">
                      {contact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a
                      href={`tel:${contact.officePhone.replace(/\D/g, "")}`}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      {contact.officePhone} <span className="text-slate-400">(Office)</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-slate-400" />
                    <a
                      href={`tel:${contact.mobilePhone.replace(/\D/g, "")}`}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      {contact.mobilePhone} <span className="text-slate-400">(Mobile)</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {contact.fax} <span className="text-slate-400">(Fax)</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add {contactType} Contact</DialogTitle>
            <DialogDescription>Add a new contact to the {contactType.toLowerCase()} contacts list.</DialogDescription>
          </DialogHeader>
          <ContactForm
            onSubmit={(data) => handleAddContact({ id: crypto.randomUUID(), ...data })}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Make changes to the contact information.</DialogDescription>
          </DialogHeader>
          {currentContact && (
            <ContactForm
              initialData={currentContact}
              onSubmit={handleEditContact}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact information for {currentContact?.name}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface ContactFormData {
  name: string
  title: string
  email: string
  officePhone: string
  mobilePhone: string
  fax: string
  address: string
}

interface ContactFormProps {
  initialData?: Contact
  onSubmit: (data: Contact) => void
  onCancel: () => void
}

function ContactForm({ initialData, onSubmit, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>(
    initialData || {
      name: "",
      title: "",
      email: "",
      officePhone: "",
      mobilePhone: "",
      fax: "",
      address: "",
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(initialData ? { ...initialData, ...formData } : { id: "", ...formData })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">
            Title
          </Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="officePhone" className="text-right">
            Office Phone
          </Label>
          <Input
            id="officePhone"
            name="officePhone"
            value={formData.officePhone}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="mobilePhone" className="text-right">
            Mobile Phone
          </Label>
          <Input
            id="mobilePhone"
            name="mobilePhone"
            value={formData.mobilePhone}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="fax" className="text-right">
            Fax
          </Label>
          <Input id="fax" name="fax" value={formData.fax} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="address" className="text-right">
            Address
          </Label>
          <Textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="col-span-3"
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

