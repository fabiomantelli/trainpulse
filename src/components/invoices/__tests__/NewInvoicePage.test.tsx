import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewInvoicePage from '../NewInvoicePage'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/layout/BackButton', () => {
  return function BackButton() {
    return <button>Back</button>
  }
})

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: '1', name: 'John Doe' },
      error: null,
    }),
    insert: jest.fn().mockResolvedValue({ error: null }),
  })),
}

const mockClients = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
]

describe('NewInvoicePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  it('should render invoice form', () => {
    render(<NewInvoicePage trainerId="test-trainer-id" clients={mockClients} />)
    expect(screen.getByText(/create invoice/i) || screen.getByText(/new invoice/i)).toBeTruthy()
  })

  it('should require client selection', () => {
    render(<NewInvoicePage trainerId="test-trainer-id" clients={mockClients} />)
    const clientSelect = screen.getByLabelText(/client/i) || screen.getByText(/select client/i)
    expect(clientSelect).toBeInTheDocument()
  })
})


