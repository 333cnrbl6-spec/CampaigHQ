# 🔧 Critical Fixes - Priority Implementation List

## 🚨 DO THIS FIRST (App Won't Build/Run)

### Fix #1: Missing React Imports in Hooks-Using Components

**Status**: BLOCKING BUILD

**Files to Fix**:
1. `components/onboarding/AvailabilityForm.jsx`
2. `components/onboarding/ImprovedCampaignSetupWizard.jsx`
3. `components/import/FieldMapper.jsx`
4. `components/import/SchemaValidator.jsx`
5. `components/import/SmartDataImporter.jsx`

**Action**: Add to top of each file:
```javascript
import React, { useState, useEffect, useCallback } from 'react';
```

---

### Fix #2: Find & Fix Radio Component Import

**The Culprit**: Something is importing `Radio` from radio-group.jsx

**Quick Check**: Search code for:
```bash
grep -r "from.*radio-group" src/
grep -r "import.*Radio" src/
```

**Temporary Workaround Applied**: Alias added to `components/ui/radio-group.jsx`

**Permanent Fix**: 
- Find the file importing `Radio`
- Change `import { Radio }` to `import { RadioGroupItem }`
- Or import as `import { RadioGroupItem as Radio }`

---

### Fix #3: Stripe Webhook Function - Async/Await Issue

**File**: `functions/handleStripeWebhook.js`  
**Current Problem**: Using synchronous crypto function in Deno (won't work)

**Replace This**:
```javascript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  Deno.env.get('STRIPE_WEBHOOK_SECRET')
);
```

**With This**:
```javascript
const event = await stripe.webhooks.constructEventAsync(
  body,
  signature,
  Deno.env.get('STRIPE_WEBHOOK_SECRET')
);
```

And add `await` to the function call.

---

## ✅ DO THIS NEXT (High Impact Bugs)

### Fix #4: Missing Error Handling - Contact Form Submission

**File**: `pages/Contacts.jsx` or `components/contacts/ContactForm.jsx`

**Add This Pattern**:
```javascript
const saveMutation = useMutation({
  mutationFn: async (data) => {
    if (!data.name?.trim()) {
      throw new Error('Contact name is required');
    }
    if (editingContact) {
      return base44.entities.Contact.update(editingContact.id, data);
    }
    return base44.entities.Contact.create(data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    showSuccess('Contact saved');
  },
  onError: (error) => {
    showError(error.message);
  },
});
```

---

### Fix #5: Add Confirmation Dialog for Delete Actions

**Template to Add Everywhere There's a Delete Button**:

```javascript
// Add to state
const [deleteConfirm, setDeleteConfirm] = useState(null);

// In JSX
{deleteConfirm && (
  <AlertDialog open onOpenChange={() => setDeleteConfirm(null)}>
    <AlertDialogContent>
      <AlertDialogTitle>Delete {deleteConfirm.type}?</AlertDialogTitle>
      <AlertDialogDescription>
        This cannot be undone. All associated data will be removed.
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          className="bg-destructive hover:bg-destructive/90"
          onClick={() => handleDelete(deleteConfirm.id)}
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}

// Replace delete buttons with:
<Button 
  variant="destructive" 
  size="sm"
  onClick={() => setDeleteConfirm({ type: 'Contact', id: contact.id })}
>
  Delete
</Button>
```

**Apply To**:
- Delete contact
- Delete task
- Delete event
- Delete turf
- Delete campaign
- Delete volunteer

---

### Fix #6: Input Validation in Forms

**Add to `lib/validation.js`** (create if missing):
```javascript
export const validators = {
  email: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  phone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  },
  
  postcode: (postcode) => {
    return /^[A-Z0-9]{1,4}\s?[A-Z0-9]{1,4}$/i.test(postcode);
  },
  
  name: (name) => {
    return name.trim().length >= 2 && name.trim().length <= 100;
  },
  
  noSpecialChars: (text) => {
    return !/[<>"{}]/.test(text);
  }
};
```

**Use in Forms**:
```javascript
const [errors, setErrors] = useState({});

const validateForm = (data) => {
  const newErrors = {};
  
  if (!validators.name(data.name)) {
    newErrors.name = 'Name required (2-100 chars)';
  }
  if (data.email && !validators.email(data.email)) {
    newErrors.email = 'Invalid email format';
  }
  if (data.phone && !validators.phone(data.phone)) {
    newErrors.phone = 'Phone must have at least 10 digits';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateForm(formData)) return;
  
  saveMutation.mutate(formData);
};
```

---

### Fix #7: Add Loading States to All Buttons

**Pattern**:
```javascript
<Button 
  disabled={isLoading || isSaving}
  onClick={handleSave}
>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      {action}...
    </>
  ) : (
    action
  )}
</Button>
```

**Buttons to Fix**:
- All form submit buttons
- Delete action buttons
- Bulk operation buttons
- Export buttons

---

### Fix #8: Better Error Messages

**Replace Generic Errors**:
```javascript
// ❌ BAD
catch (error) {
  showError('Error');
}

// ✅ GOOD
catch (error) {
  if (error.message.includes('permission')) {
    showError('You don\'t have permission to do this');
  } else if (error.message.includes('network')) {
    showError('Network error. Check your connection and try again');
  } else if (error.message.includes('required')) {
    showError(error.message);
  } else {
    showError('Something went wrong. Please try again');
  }
}
```

---

## 📋 DETAILED FIX CHECKLIST

### Contact Form Validation
- [ ] Name: required, 2-100 chars
- [ ] Email: valid format if provided
- [ ] Phone: 10+ digits
- [ ] Postcode: valid UK format
- [ ] Support level: restricted to enum
- [ ] Tags: array of strings
- [ ] No SQL injection characters

### Campaign Creation
- [ ] Name: required, not empty
- [ ] Party: from list or custom (validate)
- [ ] Candidate: optional, string
- [ ] Constituency: required
- [ ] Election date: must be future date
- [ ] Avoid duplicate campaign names

### Task Management
- [ ] Title: required
- [ ] Due date: can be past (for display)
- [ ] Status: restricted to enum
- [ ] Priority: restricted to enum
- [ ] Category: restricted to enum
- [ ] Assigned to: valid user

### Volunteer Profile
- [ ] Full name: required, 2+ chars
- [ ] Phone: required, 10+ digits
- [ ] Emergency contact: all 3 fields required if any filled
- [ ] Consent: required to proceed
- [ ] Availability: at least 1 day selected
- [ ] Preferred areas: at least 1 selected

---

## 🎯 Testing Each Fix

### After Fixing React Imports
```bash
npm run build
# Should complete without import errors
```

### After Fixing Stripe Webhook
```bash
# Test with Stripe CLI
stripe listen --forward-to localhost:3000/webhook

# Trigger test event
stripe trigger payment_intent.succeeded

# Check function logs for successful event processing
```

### After Adding Form Validation
Test each field:
- Leave required field empty → error shows
- Enter invalid format → error shows
- Enter valid data → no error
- Clear error field → error clears

### After Adding Delete Confirmation
- Click delete
- Dialog appears
- Click Cancel → dialog closes, no delete
- Click Delete → item deleted, confirmation toast
- Check item gone from list

---

## ⚡ Quick Win Improvements

### 1. Add Success Toasts
```javascript
// After successful save
showSuccess('Contact saved successfully');
showSuccess('Campaign created');
showSuccess('Profile updated');
```

### 2. Add Loading Skeletons
```javascript
import { Skeleton } from '@/components/ui/skeleton';

{isLoading ? (
  <div className="space-y-2">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  // content
)}
```

### 3. Add Empty State Messages
```javascript
{items.length === 0 ? (
  <div className="text-center py-12">
    <p className="text-muted-foreground">No contacts yet</p>
    <Button onClick={() => setShowForm(true)} className="mt-4">
      Create First Contact
    </Button>
  </div>
) : (
  // list
)}
```

---

## 📦 Recommended Refactors

### Extract Validation Hook
**Create**: `hooks/useFormValidation.js`
```javascript
export function useFormValidation(initialErrors = {}) {
  const [errors, setErrors] = useState(initialErrors);

  const validate = (data, schema) => {
    const newErrors = {};
    // validation logic
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field) => {
    setErrors(e => ({ ...e, [field]: null }));
  };

  return { errors, validate, setErrors, clearError };
}
```

### Extract API Error Handler
**Create**: `lib/apiErrorHandler.js`
```javascript
export function handleApiError(error, fallbackMessage = 'Something went wrong') {
  if (error.response?.status === 401) {
    return 'You are not authenticated';
  }
  if (error.response?.status === 403) {
    return 'You do not have permission';
  }
  if (error.response?.status === 404) {
    return 'Not found';
  }
  if (error.response?.status === 422) {
    return error.response.data.message || 'Validation failed';
  }
  return error.message || fallbackMessage;
}
```

---

## ✔️ SIGN-OFF CHECKLIST

After completing all fixes, verify:
- [ ] App builds without errors
- [ ] App starts without console errors
- [ ] Login/signup works
- [ ] Campaign creation works
- [ ] Contact form validates
- [ ] Delete actions confirm
- [ ] Forms show loading states
- [ ] Error messages are helpful
- [ ] Mobile responsive
- [ ] No memory leaks in DevTools

---

**Estimated Time**: 4-6 hours to complete all fixes  
**Risk Level**: Low (mostly UX improvements, no breaking changes)  
**Testing Impact**: Requires manual testing of all forms and buttons  

---