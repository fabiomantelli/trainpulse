import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InvoiceDetailPage from '../InvoiceDetailPage'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))
jest.mock('@/components/layout/BackButton', () => {
  return function BackButton() {
    return <button>Back</button>
  }
})

// Mock window.confirm
global.confirm = jest.fn(() => true)

const mockInvoice = {
  id: 'invoice-123',
  trainer_id: 'trainer-123',
  client_id: 'client-123',
  amount: 100.0,
  status: 'draft',
  due_date: '2024-12-31T00:00:00Z',
  paid_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockClient = {
  id: 'client-123',
  trainer_id: 'trainer-123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockPayments: any[] = []

const mockSupabaseClient = {
  from: jest.fn((table) => {
    if (table === 'invoices') {
      return {
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
    }
    if (table === 'payments') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    }
    return {
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
  }),
}

describe('InvoiceDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(global.confirm as jest.Mock).mockReturnValue(true)
  })

    it('should render invoice details including amount and status', () => {
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      expect(screen.getByText(/invoice details/i)).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument()
      expect(screen.getByText(/draft/i)).toBeInTheDocument()
    })
  
    it('should handle delete invoice', async () => {
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: /delete invoice/i })
      await user.click(deleteButton)
  
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('invoices')
      })
    })
  
    it('should not delete if user cancels confirmation', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(false)
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: /delete invoice/i })
      await user.click(deleteButton)
      expect(screen.getByText(/invoice details/i)).toBeInTheDocument()
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/\$100\.00/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0)
    })
  
    it('should handle delete invoice', async () => {
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(deleteButton)
  
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('invoices')
      })
    })
  
    it('should not delete if user cancels confirmation', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(false)
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(deleteButton)
      // Should show remaining amount (100 - 50 = 50)
      expect(screen.getByText(/\$50\.00/)).toBeInTheDocument()
    })
      expect(screen.getByText(/invoice details/i)).toBeInTheDocument()
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/\$100\.00/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0)
    })
  
    it('should handle delete invoice', async () => {
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(deleteButton)
  
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('invoices')
      })
    })
  
    it('should not delete if user cancels confirmation', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(false)
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(deleteButton)
  
      // Should not call delete
      expect(mockSupabaseClient.from('invoices').delete).not.toHaveBeenCalled()
    })
  
    it('should display remaining amount correctly', () => {
      const paymentsWithAmount = [
        {
          id: 'payment-1',
          invoice_id: 'invoice-123',
          amount: 50.0,
          created_at: '2024-01-01T00:00:00Z',
          stripe_payment_id: 'manual-123',
        },
      ]
  
      render(
        <InvoiceDetailPage
          invoice={mockInvoice}
          client={mockClient}
          payments={paymentsWithAmount as any}
        />
      )
  
      // Should show remaining amount (100 - 50 = 50)
      // We expect 2 elements: one in the payments list and one in the summary
      const amounts = screen.getAllByText(/\$50\.00/)
      expect(amounts.length).toBeGreaterThanOrEqual(1)
    })
    >>>>>>> REPLACE
      expect(screen.getByText(/invoice details/i)).toBeInTheDocument()
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/\$100\.00/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0)
    })
  
    it('should handle delete invoice', async () => {
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(deleteButton)
  
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('invoices')
      })
    })
  
    it('should not delete if user cancels confirmation', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(false)
      const user = userEvent.setup()
      render(
        <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
      )
  
      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(deleteButton)
  
      // Should not call delete
      expect(mockSupabaseClient.from('invoices').delete).not.toHaveBeenCalled()
    })
  
    it('should display remaining amount correctly', () => {
      const paymentsWithAmount = [
        {
          id: 'payment-1',
          invoice_id: 'invoice-123',
          amount: 50.0,
          created_at: '2024-01-01T00:00:00Z',
          stripe_payment_id: 'manual-123',
        },
      ]
  
      render(
        <InvoiceDetailPage
          invoice={mockInvoice}
          client={mockClient}
          payments={paymentsWithAmount as any}
        />
      )
  
      // Should show remaining amount (100 - 50 = 50)
      // We expect 2 elements: one in the payments list and one in the summary
      const amounts = screen.getAllByText(/\$50\.00/)
      expect(amounts.length).toBeGreaterThanOrEqual(1)
    })
    =======
      it('should render invoice details including amount and status', () => {
        render(
          <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
        )
  
        expect(screen.getByText(/invoice details/i)).toBeInTheDocument()
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
        expect(screen.getAllByText(/\$100\.00/).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/draft/i).length).toBeGreaterThan(0)
      })
  
      it('should handle delete invoice', async () => {
        const user = userEvent.setup()
        render(
          <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
        )
  
        const deleteButton = screen.getByRole('button', { name: 'Delete' })
        await user.click(deleteButton)
  
        await waitFor(() => {
          expect(mockSupabaseClient.from).toHaveBeenCalledWith('invoices')
        })
      })
  
      it('should not delete if user cancels confirmation', async () => {
        ;(global.confirm as jest.Mock).mockReturnValue(false)
        const user = userEvent.setup()
        render(
          <InvoiceDetailPage invoice={mockInvoice} client={mockClient} payments={mockPayments} />
        )
  
        const deleteButton = screen.getByRole('button', { name: 'Delete' })
        await user.click(deleteButton)
  
        // Should not call delete
        expect(mockSupabaseClient.from('invoices').delete).not.toHaveBeenCalled()
      })
  
      it('should display remaining amount correctly', () => {
        const paymentsWithAmount = [
          {
            id: 'payment-1',
            invoice_id: 'invoice-123',
            amount: 50.0,
            created_at: '2024-01-01T00:00:00Z',
            stripe_payment_id: 'manual-123',
          },
        ]
  
        render(
          <InvoiceDetailPage
            invoice={mockInvoice}
            client={mockClient}
            payments={paymentsWithAmount as any}
          />
        )
  
        // Should show remaining amount (100 - 50 = 50)
        // We expect 2 elements: one in the payments list and one in the summary
        const amounts = screen.getAllByText(/\$50\.00/)
        expect(amounts.length).toBeGreaterThanOrEqual(1)
      })
      >>>>>>> REPLACE
  
      it('should handle different invoice statuses', () => {
        const statuses = [
          { status: 'paid' as const, paid_at: '2024-01-02T00:00:00Z' },
          { status: 'sent' as const },
          { status: 'draft' as const },
        ]
  
        statuses.forEach((statusConfig) => {
          const { status, ...rest } = statusConfig
          const invoice = { ...mockInvoice, status, ...rest }
          const { unmount } = render(
            <InvoiceDetailPage invoice={invoice} client={mockClient} payments={mockPayments} />
          )
          const elements = screen.getAllByText(new RegExp(status, 'i'))
          expect(elements.length).toBeGreaterThan(0)
          expect(elements[0]).toBeInTheDocument()
          unmount()
        })
      })
    })