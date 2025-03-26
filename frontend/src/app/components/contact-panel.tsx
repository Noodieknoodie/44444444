"use client"

import type React from "react"

import { useState } from "react"
import { Pencil, Trash2, Plus, MapPin, Mail, Phone, Smartphone, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Client } from "@/lib/types"

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
  client: Client
}

export function ContactPanel({ client }: ContactPanelProps) {
  // Mock contacts data - in a real app, this would come from an API
  const initialContacts = {
    primary: [
      {
        id: "1",
        name: "John Smith",
        title: "Plan Administrator",
        email: "john.smith@example.com",
        officePhone: "(555) 123-4567",
        mobilePhone: "(555) 987-6543",
        fax: "(555) 765-4321",
        address: "123 Main St, Suite 400, Boston, MA 02108",
      },
    ],
    authorized: [
      {
        id: "2",
        name: "Sarah Johnson",
        title: "Finance Manager",
        email: "sarah.johnson@example.com",
        officePhone: "(555) 234-5678",
        mobilePhone: "(555) 876-5432",
        fax: "(555) 654-3210",
        address: "123 Main St, Suite 405, Boston, MA 02108",
      },
      {
        id: "3",
        name: "Robert Williams",
        title: "HR Director",
        email: "robert.williams@example.com",
        officePhone: "(555) 345-6789",
        mobilePhone: "(555) 765-4321",
        fax: "(555) 543-2109",
        address: "123 Main St, Suite 410, Boston, MA 02108",
      },
    ],
    provider: [
      {
        id: "4",
        name: "Michael Davis",
        title: `Account Manager at ${client.provider}`,
        email: "michael.davis@provider.com",
        officePhone: "(555) 456-7890",
        mobilePhone: "(555) 654-3210",
        fax: "(555) 432-1098",
        address: "456 Provider Plaza, Suite 300, Chicago, IL 60601",
      },
    ],
  }

  const [contacts, setContacts] = useState(initialContacts)
  const [contactType, setContactType] = useState<"primary" | "authorized" | "provider">("primary")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)

  const handleAddContact = (contact: Contact) => {
    setContacts({
      ...contacts,
      [contactType]: [...contacts[contactType], { ...contact, id: crypto.randomUUID() }],
    })
    setIsAddDialogOpen(false)
  }

  const handleEditContact = (updatedContact: Contact) => {
    setContacts({
      ...contacts,
      [contactType]: contacts[contactType].map((c) => (c.id === updatedContact.id ? updatedContact : c)),
    })
    setIsEditDialogOpen(false)
    setCurrentContact(null)
  }

  const handleDeleteContact = () => {
    if (currentContact) {
      setContacts({
        ...contacts,
        [contactType]: contacts[contactType].filter((c) => c.id !== currentContact.id),
      })
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

  const handleTabChange = (value: string) => {
    setContactType(value as "primary" | "authorized" | "provider")
  }

  return (
    <div>
      <Tabs defaultValue="primary" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="primary">Primary</TabsTrigger>
          <TabsTrigger value="authorized">Authorized</TabsTrigger>
          <TabsTrigger value="provider">Provider</TabsTrigger>
        </TabsList>

        {(["primary", "authorized", "provider"] as const).map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{type.charAt(0).toUpperCase() + type.slice(1)} Contacts</h3>
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

              {contacts[type].length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <p className="text-sm text-slate-500">No contacts found</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {type.charAt(0).toUpperCase() + type.slice(1)} Contact
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts[type].map((contact) => (
                    <Card key={contact.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{contact.name}</h4>
                            <p className="text-sm text-slate-500">{contact.title}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(contact)}
                            >
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
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Add a new contact to the {contactType} contacts list.</DialogDescription>
          </DialogHeader>
          <ContactForm onSubmit={handleAddContact} onCancel={() => setIsAddDialogOpen(false)} />
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

