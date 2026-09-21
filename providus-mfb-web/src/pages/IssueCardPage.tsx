import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { PlusCircle, CheckCircle2, AlertCircle, Settings, CreditCard, ArrowRight, ArrowLeft, Layers, UserCheck, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const IssueCardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Request Mode: 'personalized' (sends nameOnCards) vs 'instant' (sends instantQty)
  const [requestType, setRequestType] = useState<'personalized' | 'instant'>('personalized');

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedCardProfileId, setSelectedCardProfileId] = useState<string>('');

  // Instant mode quantity
  const [instantQty, setInstantQty] = useState<number>(1);

  // Personalized mode names
  const [personalizedQty, setPersonalizedQty] = useState<number>(1);
  const [nameMode, setNameMode] = useState<'single' | 'multiple'>('single');
  const [singleName, setSingleName] = useState<string>('PREPAID CARDHOLDER');
  const [rawTextareaNames, setRawTextareaNames] = useState<string>('PREPAID CARDHOLDER');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: api.getProfiles,
  });

  const { data: cardProfiles, isLoading: isLoadingCardProfiles } = useQuery({
    queryKey: ['cardProfiles'],
    queryFn: api.getCardProfiles,
  });

  useEffect(() => {
    if (requestType === 'personalized' && personalizedQty > 0) {
      if (nameMode === 'single') {
        setRawTextareaNames(Array(personalizedQty).fill(singleName || 'PREPAID CARDHOLDER').join('\n'));
      }
    }
  }, [personalizedQty, singleName, nameMode, requestType]);

  const requestCardMutation = useMutation({
    mutationFn: api.requestCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      navigate('/cards');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Prepaid card request failed');
    },
  });

  const getEffectiveNamesList = (): string[] => {
    if (nameMode === 'single') {
      const trimmed = singleName.trim().toUpperCase() || 'PREPAID CARDHOLDER';
      return Array(personalizedQty).fill(trimmed);
    } else {
      const lines = rawTextareaNames
        .split('\n')
        .map((l) => l.trim().toUpperCase())
        .filter((l) => l.length > 0);
      
      if (lines.length === 0) return ['PREPAID CARDHOLDER'];
      return lines;
    }
  };

  const handleNextStep1 = () => {
    if (!selectedProfileId || !selectedCardProfileId) {
      setErrorMsg('Please select both Profile ID and Card Profile ID from Providus FIP options.');
      return;
    }
    if (requestType === 'instant') {
      if (instantQty < 1) {
        setErrorMsg('Instant quantity must be at least 1.');
        return;
      }
      setErrorMsg(null);
      setStep(3); // Skip step 2 for Instant card requests
    } else {
      if (personalizedQty < 1) {
        setErrorMsg('Card count must be at least 1.');
        return;
      }
      setErrorMsg(null);
      setStep(2); // Go to Step 2 for Personalized names
    }
  };

  const handleNextStep2 = () => {
    const effectiveList = getEffectiveNamesList();
    if (effectiveList.length === 0) {
      setErrorMsg('Please specify at least one cardholder name in nameOnCards.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleSubmitRequest = () => {
    if (!selectedProfileId || !selectedCardProfileId) {
      setErrorMsg('Missing required parameters for card request.');
      return;
    }

    if (requestType === 'personalized') {
      const effectiveList = getEffectiveNamesList();
      if (effectiveList.length === 0) {
        setErrorMsg('At least one cardholder name is required for a personalized card request.');
        return;
      }

      // Personalized Card Request: sends nameOnCards array, instantQty is undefined
      requestCardMutation.mutate({
        profileId: selectedProfileId,
        cardProfileId: selectedCardProfileId,
        nameOnCards: effectiveList,
      });
    } else {
      // Instant Card Request: sends instantQty, nameOnCards is undefined
      if (instantQty < 1) {
        setErrorMsg('Instant quantity must be greater than zero.');
        return;
      }
      requestCardMutation.mutate({
        profileId: selectedProfileId,
        cardProfileId: selectedCardProfileId,
        instantQty: instantQty,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-primary" />
          <span>Prepaid Card Requests</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Request prepaid card inventory/batches from Providus FIP. Choose between <strong className="text-foreground">Personalized Cards</strong> (`nameOnCards`) and <strong className="text-foreground">Instant Cards</strong> (`instantQty`).
        </p>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
        <div className={`p-3 rounded-xl border flex items-center gap-2 ${step === 1 ? 'bg-primary/10 border-primary text-primary' : step > 1 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-border text-muted-foreground'}`}>
          <div className="w-6 h-6 rounded-full border flex items-center justify-center font-bold">1</div>
          <span>Request Mode & Profiles</span>
        </div>
        <div className={`p-3 rounded-xl border flex items-center gap-2 ${requestType === 'instant' ? 'opacity-40 bg-muted border-border text-muted-foreground' : step === 2 ? 'bg-primary/10 border-primary text-primary' : step > 2 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-border text-muted-foreground'}`}>
          <div className="w-6 h-6 rounded-full border flex items-center justify-center font-bold">2</div>
          <span>Cardholder Branding {requestType === 'instant' ? '(N/A for Instant)' : ''}</span>
        </div>
        <div className={`p-3 rounded-xl border flex items-center gap-2 ${step === 3 ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
          <div className="w-6 h-6 rounded-full border flex items-center justify-center font-bold">3</div>
          <span>Confirm & Submit</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wizard Step 1: Request Mode & Profiles */}
      {step === 1 && (
        <div className="neo-card p-6 space-y-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" /> Step 1: Select Card Request Type & Profiles
          </h3>

          {/* Request Type Selector Cards */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRequestType('personalized')}
              className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                requestType === 'personalized'
                  ? 'bg-primary/10 border-primary ring-2 ring-primary/20 text-foreground'
                  : 'bg-muted/40 border-border text-muted-foreground hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <UserCheck className={`w-5 h-5 ${requestType === 'personalized' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${requestType === 'personalized' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  Custom Names
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">Personalized Card Request</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Sends <code className="text-primary font-mono font-semibold">nameOnCards</code> array. Cardholder names are custom printed/embossed.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRequestType('instant')}
              className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                requestType === 'instant'
                  ? 'bg-primary/10 border-primary ring-2 ring-primary/20 text-foreground'
                  : 'bg-muted/40 border-border text-muted-foreground hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <Package className={`w-5 h-5 ${requestType === 'instant' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${requestType === 'instant' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  Stock Batch
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">Instant Card Request</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Sends <code className="text-primary font-mono font-semibold">instantQty</code> integer count. Un-embossed card stock for over-the-counter distribution.
                </div>
              </div>
            </button>
          </div>

          <div className="space-y-4 text-xs pt-2">
            <div>
              <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Providus Profile ID *
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none focus:border-primary"
              >
                <option value="">{isLoadingProfiles ? 'Loading Profiles...' : '-- Select Profile --'}</option>
                {profiles?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Providus Card Profile ID *
              </label>
              <select
                value={selectedCardProfileId}
                onChange={(e) => setSelectedCardProfileId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none focus:border-primary"
              >
                <option value="">{isLoadingCardProfiles ? 'Loading Card Profiles...' : '-- Select Card Profile --'}</option>
                {cardProfiles?.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} ({cp.id})
                  </option>
                ))}
              </select>
            </div>

            {requestType === 'instant' ? (
              <div>
                <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Instant Quantity (`instantQty`) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={instantQty}
                  onChange={(e) => setInstantQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2.5 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Number of un-embossed prepaid card stock items to request from Providus FIP.</p>
              </div>
            ) : (
              <div>
                <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Number of Cards to Request *
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={personalizedQty}
                  onChange={(e) => setPersonalizedQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2.5 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">In Step 2 you will specify cardholder name(s) for the <code className="font-mono text-primary font-semibold">nameOnCards</code> array.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={handleNextStep1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-90"
            >
              <span>{requestType === 'instant' ? 'Next: Confirmation' : 'Next: Cardholder Name(s)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 2: Name on Card(s) - Personalized Only */}
      {step === 2 && requestType === 'personalized' && (
        <div className="neo-card p-6 space-y-5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Step 2: Cardholder Branding (`nameOnCards` array)
          </h3>

          <div className="space-y-4 text-xs">
            {/* Mode selector tab */}
            <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setNameMode('single')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nameMode === 'single'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Same Name for Batch ({personalizedQty} Cards)
              </button>
              <button
                type="button"
                onClick={() => setNameMode('multiple')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nameMode === 'multiple'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Distinct Names per Card ({personalizedQty} Names)
              </button>
            </div>

            {nameMode === 'single' ? (
              <div>
                <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Cardholder Name (Applied to all {personalizedQty} cards) *
                </label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="e.g. PREPAID CARDHOLDER"
                  className="w-full p-2.5 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:border-primary text-foreground font-semibold uppercase font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  This name will be duplicated across the `nameOnCards` array for all {personalizedQty} requested cards.
                </p>
              </div>
            ) : (
              <div>
                <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  List of Names for `nameOnCards` array (Enter 1 name per line) *
                </label>
                <textarea
                  rows={Math.min(Math.max(personalizedQty, 3), 10)}
                  value={rawTextareaNames}
                  onChange={(e) => setRawTextareaNames(e.target.value)}
                  placeholder={`PREPAID CARDHOLDER 1\nPREPAID CARDHOLDER 2\nPREPAID CARDHOLDER 3`}
                  className="w-full p-3 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:border-primary text-foreground font-mono font-semibold uppercase leading-relaxed"
                />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1 font-mono">
                  <span>Detected names count: {getEffectiveNamesList().length}</span>
                  <span>Batch quantity: {personalizedQty}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNextStep2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-90"
            >
              <span>Next: Confirmation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 3: Confirmation */}
      {step === 3 && (
        <div className="neo-card p-6 space-y-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Step 3: Confirm Providus Card Request
          </h3>

          <div className="p-4 rounded-xl bg-muted/60 border border-border text-xs space-y-3 font-mono">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Request Type:</span>
              <span className="font-bold text-primary capitalize">{requestType} Card Request</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Providus Profile ID:</span>
              <span className="font-bold text-foreground">{selectedProfileId}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Card Profile ID:</span>
              <span className="font-bold text-foreground">{selectedCardProfileId}</span>
            </div>

            {requestType === 'personalized' ? (
              <div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground">`nameOnCards` Array Payload ({getEffectiveNamesList().length} names):</span>
                  <span className="font-bold text-amber-500 font-mono">`instantQty` is omitted</span>
                </div>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border max-h-36 overflow-y-auto font-mono text-[11px] text-emerald-400">
                  {getEffectiveNamesList().map((nm, idx) => (
                    <div key={idx} className="truncate">
                      [{idx + 1}] "{nm}"
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">`instantQty` Stock Quantity:</span>
                  <span className="font-bold text-emerald-400 font-mono">{instantQty} Card(s)</span>
                </div>
                <div className="pt-2 text-[11px] text-amber-500 font-mono">
                  `nameOnCards` array is omitted from outgoing Providus payload.
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <button
              onClick={() => setStep(requestType === 'personalized' ? 2 : 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSubmitRequest}
              disabled={requestCardMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{requestCardMutation.isPending ? 'Submitting to Providus FIP...' : 'Submit Card Request'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
