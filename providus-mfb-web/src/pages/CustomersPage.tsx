import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { OnboardCustomerRequest, Customer } from '../types';
import { UserPlus, Search, Users, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, X, UserCheck, CreditCard, Eye } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Customer Linking State
  const [selectedCustomerForLink, setSelectedCustomerForLink] = useState<Customer | null>(null);
  const [selectedCardIdForLink, setSelectedCardIdForLink] = useState<string>('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<OnboardCustomerRequest>({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    email: '',
    address: '',
    nationality: 'Nigerian',
    residentCountry: 'Nigeria',
    countryCode: '234',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => api.getCustomers({ search, page, pageSize: 10 }),
  });

  const { data: cardsList } = useQuery({
    queryKey: ['availableCardsList'],
    queryFn: () => api.getCards(),
    enabled: !!selectedCustomerForLink,
  });

  const onboardMutation = useMutation({
    mutationFn: api.onboardCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        phone: '',
        email: '',
        address: '',
        nationality: 'Nigerian',
        residentCountry: 'Nigeria',
        countryCode: '234',
      });
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Customer onboarding failed');
    },
  });

  const linkCardMutation = useMutation({
    mutationFn: ({ customerId, cardId }: { customerId: string; cardId: string }) =>
      api.addCard({ customerId, cardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomerForLink(null);
      setSelectedCardIdForLink('');
      setLinkError(null);
    },
    onError: (err: any) => {
      setLinkError(err.message || 'Card linking failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.nationality || !formData.countryCode) {
      setFormError('First Name, Last Name, Phone, Nationality, and Country Code are required.');
      return;
    }
    onboardMutation.mutate(formData);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForLink || !selectedCardIdForLink) {
      setLinkError('Please select a card to link.');
      return;
    }
    linkCardMutation.mutate({
      customerId: selectedCustomerForLink.id,
      cardId: selectedCardIdForLink,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Customer Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage onboarded customers & provision Providus FIP mappings
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Customer</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customers by name, phone, email, or Providus Customer ID..."
          className="flex-1 bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Customers Table */}
      <div className="neo-card overflow-hidden">
        <div className="overflow-auto max-h-[500px] w-full">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Local ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Providus Customer ID</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Nationality / Resident</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Onboarded Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border whitespace-nowrap">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Loading customers...
                  </td>
                </tr>
              ) : customerData?.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customerData?.items.map((cust) => (
                  <tr key={cust.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-foreground" title={cust.id}>#{cust.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      {cust.firstName} {cust.middleName ? `${cust.middleName} ` : ''}{cust.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-primary font-medium">{cust.providusCustomerId}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{cust.phone}</td>
                    <td className="py-3 px-4 text-muted-foreground">{cust.email || '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {cust.nationality}{cust.residentCountry ? ` (${cust.residentCountry})` : ''}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate" title={cust.address || ''}>
                      {cust.address || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/customers/${cust.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-[11px]"
                        title="View customer account details & cards"
                      >
                        <Eye className="w-3 h-3" /> View Account
                      </Link>
                      <button
                        onClick={() => { setSelectedCustomerForLink(cust); setSelectedCardIdForLink(''); setLinkError(null); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-semibold text-[11px]"
                        title="Link an inventory card to this customer"
                      >
                        <UserCheck className="w-3 h-3" /> Link Card
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing page {customerData?.page ?? 1} of {Math.ceil((customerData?.total ?? 0) / 10) || 1} ({customerData?.total ?? 0} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!customerData || page * 10 >= customerData.total}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Link Card Modal */}
      {selectedCustomerForLink && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Link Card to {selectedCustomerForLink.firstName} {selectedCustomerForLink.lastName}</span>
              </h2>
              <button onClick={() => setSelectedCustomerForLink(null)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs font-mono space-y-1">
              <p><span className="text-muted-foreground">Customer:</span> <span className="text-foreground font-bold">{selectedCustomerForLink.firstName} {selectedCustomerForLink.lastName}</span></p>
              <p><span className="text-muted-foreground">Providus Customer ID:</span> <span className="text-primary">{selectedCustomerForLink.providusCustomerId}</span></p>
            </div>

            {linkError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Select Prepaid Card from Inventory *</label>
                <select
                  required
                  value={selectedCardIdForLink}
                  onChange={(e) => setSelectedCardIdForLink(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-indigo-500 text-foreground font-mono"
                >
                  <option value="">-- Choose Card --</option>
                  {cardsList?.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.providusCardId} ({card.maskedPan}) - {card.nameOnCard}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedCustomerForLink(null)} className="px-4 py-2 rounded-xl border border-border">Cancel</button>
                <button
                  type="submit"
                  disabled={linkCardMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50"
                >
                  {linkCardMutation.isPending ? 'Linking Card...' : 'Confirm Card Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto m-2 sm:m-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <span>Onboard New Customer</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Middle Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chukwuemeka"
                    value={formData.middleName || ''}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Phone Number (E.164) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+2348012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Address Field */}
              <div>
                <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. 15 Broad Street, Victoria Island, Lagos"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              {/* Country & Nationality */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Nationality *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nigerian"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Resident Country</label>
                  <input
                    type="text"
                    placeholder="Nigeria"
                    value={formData.residentCountry || ''}
                    onChange={(e) => setFormData({ ...formData, residentCountry: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Country Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="234"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50"
                >
                  {onboardMutation.isPending ? 'Onboarding...' : 'Onboard Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
