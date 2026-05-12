import React, { useState, useEffect, useRef } from 'react';
import "./Dashboard.css";
import { Users, Plus, DollarSign, Send, CheckCircle, X, AlertCircle, Receipt, Clock, Check, XCircle, MessageCircle, Percent, Wallet, CreditCard, BarChart3 } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);



  const ExpenseSplitterApp = () => {
  const [currentUser] = useState({ id: '1', name: 'Phani', phone: '+919898989898' });
  const [view, setView] = useState('groups');
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [offlinePayments, setOfflinePayments] = useState([]); // Added missing state

  const [showManualContact, setShowManualContact] = useState(false);
  const [manualContactData, setManualContactData] = useState({ name: '', phone: '' });

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseData, setExpenseData] = useState({
    category: '',
    description: '',
    amount: '',
    paidBy: [],
    splitType: 'equal',
    splitAmong: [],
    customSplits: []
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef(null);
  
  const [showAnalytics, setShowAnalytics] = useState(false);
  const chartRefs = useRef({});


  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [expenses, settlements, offlinePayments]);

  const validatePhone = (phone) => {
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const addManualContact = () => {
    if (!manualContactData.name.trim()) {
      alert('Please enter contact name');
      return;
    }

    if (!manualContactData.phone.trim()) {
      alert('Please enter phone number');
      return;
    }

    if (!validatePhone(manualContactData.phone)) {
      alert('Please enter a valid Indian phone number (e.g., +919876543210)');
      return;
    }

    const isDuplicate = contacts.some(c => c.phone === manualContactData.phone);
    if (isDuplicate) {
      alert('This contact already exists!');
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: manualContactData.name.trim(),
      phone: manualContactData.phone.trim(),
      isRegistered: true
    };

    setContacts([...contacts, newContact]);
    setManualContactData({ name: '', phone: '' });
    setShowManualContact(false);
    alert('✓ Contact added successfully!');
  };

  const createGroup = () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedMembers.length < 1) {
      alert('Please select at least 2 members to create a group');
      return;
    }

    const memberIds = selectedMembers.map(m => m.userId);
    if (new Set(memberIds).size !== memberIds.length) {
      alert('Duplicate members selected. Each member can only be added once.');
      return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      members: [
        { userId: currentUser.id, name: currentUser.name, phone: currentUser.phone },
        ...selectedMembers
      ],
      createdAt: new Date()
    };
    
    setGroups([...groups, newGroup]);
    setShowGroupForm(false);
    setGroupName('');
    setSelectedMembers([]);
    alert('✓ Group created successfully!');
  };

  const addExpense = () => {
    if (!expenseData.category.trim()) {
      alert('Please enter expense category (e.g., Dinner, Auto, Hotel)');
      return;
    }

    if (!expenseData.description.trim()) {
      alert('Please enter expense description');
      return;
    }

    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (expenseData.paidBy.length === 0) {
      alert('Please select at least one person who paid');
      return;
    }

    if (expenseData.splitAmong.length === 0) {
      alert('Please select at least one person to split among');
      return;
    }

    const totalAmount = parseFloat(expenseData.amount);

    // Validate that total paid equals expense amount
    const totalPaid = expenseData.paidBy.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    if (Math.abs(totalPaid - totalAmount) > 0.01) {
      alert(`Total paid amount (₹${totalPaid.toFixed(2)}) must equal expense amount (₹${totalAmount})`);
      return;
    }

    // Validate split amounts based on type
    let splitDetails = [];
    if (expenseData.splitType === 'equal') {
      const perPerson = totalAmount / expenseData.splitAmong.length;
      splitDetails = expenseData.splitAmong.map(s => ({
        userId: s.userId,
        name: s.name,
        amount: perPerson
      }));
    } else if (expenseData.splitType === 'unequal') {
      const totalSplit = expenseData.customSplits.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        alert(`Split amounts must equal total amount. Current: ₹${totalSplit.toFixed(2)}, Expected: ₹${totalAmount}`);
        return;
      }
      splitDetails = expenseData.customSplits.filter(s => parseFloat(s.amount || 0) > 0);
    } else if (expenseData.splitType === 'percentage') {
      const totalPercent = expenseData.customSplits.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        alert(`Percentages must add up to 100%. Current: ${totalPercent.toFixed(2)}%`);
        return;
      }
      splitDetails = expenseData.customSplits.map(s => ({
        userId: s.userId,
        name: s.name,
        amount: (totalAmount * parseFloat(s.percentage)) / 100
      }));
    }

    const expense = {
      id: Date.now().toString(),
      groupId: selectedGroup.id,
      category: expenseData.category.trim(),
      description: expenseData.description.trim(),
      amount: totalAmount,
      paidBy: expenseData.paidBy,
      splitType: expenseData.splitType,
      splitDetails: splitDetails,
      date: new Date().toISOString(),
      addedBy: currentUser.id
    };

    setExpenses([...expenses, expense]);
    
    setShowExpenseForm(false);
    setExpenseData({
      category: '',
      description: '',
      amount: '',
      paidBy: [],
      splitType: 'equal',
      splitAmong: [],
      customSplits: []
    });
    
    alert('✓ Expense added successfully!');
  };

  const togglePaidBy = (userId, name) => {
    if (expenseData.paidBy.some(p => p.userId === userId)) {
      setExpenseData({
        ...expenseData,
        paidBy: expenseData.paidBy.filter(p => p.userId !== userId)
      });
    } else {
      setExpenseData({
        ...expenseData,
        paidBy: [...expenseData.paidBy, { userId, name, amount: '', paymentMode: 'online' }]
      });
    }
  };

  const updatePaidBy = (userId, field, value) => {
    setExpenseData({
      ...expenseData,
      paidBy: expenseData.paidBy.map(p => 
        p.userId === userId ? { ...p, [field]: value } : p
      )
    });
  };

  const toggleSplitAmong = (userId, name) => {
    const isSelected = expenseData.splitAmong.some(s => s.userId === userId);
    
    if (isSelected) {
      setExpenseData({
        ...expenseData,
        splitAmong: expenseData.splitAmong.filter(s => s.userId !== userId),
        customSplits: expenseData.customSplits.filter(s => s.userId !== userId)
      });
    } else {
      const newSplitAmong = [...expenseData.splitAmong, { userId, name }];
      let newCustomSplits = [...expenseData.customSplits];
      
      if (expenseData.splitType !== 'equal') {
        newCustomSplits.push({
          userId,
          name,
          amount: '',
          percentage: ''
        });
      }
      
      setExpenseData({
        ...expenseData,
        splitAmong: newSplitAmong,
        customSplits: newCustomSplits
      });
    }
  };

  const changeSplitType = (type) => {
    const customSplits = expenseData.splitAmong.map(s => ({
      userId: s.userId,
      name: s.name,
      amount: '',
      percentage: ''
    }));
    
    setExpenseData({
      ...expenseData,
      splitType: type,
      customSplits: type === 'equal' ? [] : customSplits
    });
  };

  const updateCustomSplit = (userId, field, value) => {
    const updated = expenseData.customSplits.map(s =>
      s.userId === userId ? { ...s, [field]: value } : s
    );
    setExpenseData({ ...expenseData, customSplits: updated });
  };

  const calculateSmartSettlements = () => {
    if (!selectedGroup) return;

    // Initialize balances for all members
    const balances = {};
    selectedGroup.members.forEach(member => {
      balances[member.userId] = { 
        amount: 0, 
        name: member.name,
        phone: member.phone 
      };
    });

    // Process all expenses
    expenses
      .filter(e => e.groupId === selectedGroup.id)
      .forEach(expense => {
        // Credit to those who paid
        expense.paidBy.forEach(payer => {
          balances[payer.userId].amount += parseFloat(payer.amount);
        });

        // Debit from everyone who should pay their share
        expense.splitDetails.forEach(split => {
          balances[split.userId].amount -= parseFloat(split.amount);
        });
      });

    // Process approved offline payments between members
    offlinePayments
      .filter(p => p.groupId === selectedGroup.id && p.status === 'approved')
      .forEach(payment => {
        balances[payment.from].amount += payment.amount;
        balances[payment.to].amount -= payment.amount;
      });

    // Separate into debtors (owe money) and creditors (are owed money)
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(userId => {
      const balance = Math.round(balances[userId].amount * 100) / 100;
      if (balance < -0.01) {
        // This person owes money
        debtors.push({ 
          userId, 
          amount: -balance, 
          name: balances[userId].name,
          phone: balances[userId].phone 
        });
      } else if (balance > 0.01) {
        // This person is owed money
        creditors.push({ 
          userId, 
          amount: balance, 
          name: balances[userId].name,
          phone: balances[userId].phone 
        });
      }
    });

    // Sort for optimal matching (largest amounts first)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Generate minimal transactions using greedy algorithm
    const transactions = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
      
      if (settleAmount > 0.01) {
        transactions.push({
          id: `settle-${debtors[i].userId}-${creditors[j].userId}-${Date.now()}`,
          from: debtors[i].userId,
          fromName: debtors[i].name,
          fromPhone: debtors[i].phone,
          to: creditors[j].userId,
          toName: creditors[j].name,
          toPhone: creditors[j].phone,
          amount: Math.round(settleAmount * 100) / 100,
          status: 'pending'
        });
      }

      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;

      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    setSettlements(transactions);
    setView('settlements');
  };

  const recordOfflinePayment = () => {
    const fromName = prompt('Who paid? (Enter name)');
    const toName = prompt('To whom? (Enter name)');
    const amount = prompt('Amount paid (₹)');
    const note = prompt('Note/Description (optional)');

    if (!fromName || !toName || !amount) {
      alert('Please provide all required details');
      return;
    }

    const fromMember = selectedGroup.members.find(m => 
      m.name.toLowerCase().includes(fromName.toLowerCase())
    );
    const toMember = selectedGroup.members.find(m => 
      m.name.toLowerCase().includes(toName.toLowerCase())
    );

    if (!fromMember || !toMember) {
      alert('Could not find member(s). Please check the names.');
      return;
    }

    if (fromMember.userId === toMember.userId) {
      alert('Cannot create payment to the same person!');
      return;
    }

    const offlinePayment = {
      id: Date.now().toString(),
      groupId: selectedGroup.id,
      from: fromMember.userId,
      fromName: fromMember.name,
      to: toMember.userId,
      toName: toMember.name,
      amount: parseFloat(amount),
      note: note || '',
      status: 'pending',
      recordedBy: currentUser.id,
      date: new Date().toISOString()
    };

    setOfflinePayments([...offlinePayments, offlinePayment]);
    alert('✓ Offline payment recorded. Waiting for approval...');
  };

  const approveOfflinePayment = (paymentId) => {
    setOfflinePayments(offlinePayments.map(p =>
      p.id === paymentId ? { ...p, status: 'approved', approvedBy: currentUser.id, approvedAt: new Date().toISOString() } : p
    ));
    alert('✓ Payment approved!');
  };

  const rejectOfflinePayment = (paymentId) => {
    setOfflinePayments(offlinePayments.map(p =>
      p.id === paymentId ? { ...p, status: 'rejected', rejectedBy: currentUser.id, rejectedAt: new Date().toISOString() } : p
    ));
    alert('✗ Payment rejected');
  };

  const initiateSettlementPayment = (settlement) => {
    setSelectedPayment(settlement);
    setShowPaymentModal(true);
  };

  const processSettlementPayment = async () => {
    if (!selectedPayment) return;
    
    setIsProcessingPayment(true);

    try {
      // First, check if backend is running and Cashfree is configured
      const response = await fetch('http://localhost:3001/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPayment.amount,
          customerName: currentUser.name,
          customerPhone: currentUser.phone,
          settlementId: selectedPayment.id
        })
      });

      if (!response.ok) {
        throw new Error('Backend server not responding. Please make sure the server is running on port 3001.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      const { sessionId, orderId } = data;

      // Check if Cashfree SDK is loaded, if not load it
      if (!window.Cashfree) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
          document.head.appendChild(script);
        });
      }

      // Initialize Cashfree
      const cashfree = window.Cashfree({ mode: 'sandbox' });

      const checkoutOptions = {
        paymentSessionId: sessionId,
        returnUrl: `${window.location.origin}/payment-success?order_id=${orderId}&settlement_id=${selectedPayment.id}`
      };

      console.log('Initiating Cashfree checkout:', checkoutOptions);

      const result = await cashfree.checkout(checkoutOptions);

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      // If we reach here, payment was successful
      const updatedSettlements = settlements.map(s =>
        s.id === selectedPayment.id ? {
          ...s,
          status: 'completed',
          proof: {
            cashfreeOrderId: orderId,
            transactionId: result.paymentDetails?.transactionId || orderId,
            timestamp: new Date().toISOString()
          }
        } : s
      );
      
      setSettlements(updatedSettlements);
      setShowPaymentModal(false);
      setSelectedPayment(null);
      
      alert('✓ Payment successful via Cashfree! Transaction completed.');
      
    } catch (error) {
      console.error('Payment error:', error);
      
      // Fallback to simulated payment if Cashfree fails
      if (error.message.includes('Backend server') || error.message.includes('Cashfree SDK')) {
        alert('Payment gateway not available. Using simulated payment for demo.');
        
        // Simulate payment success
        setTimeout(() => {
          const updatedSettlements = settlements.map(s =>
            s.id === selectedPayment.id ? {
              ...s,
              status: 'completed',
              proof: {
                cashfreeOrderId: 'DEMO_ORDER_' + Date.now(),
                transactionId: 'DEMO_TXN_' + Date.now(),
                timestamp: new Date().toISOString()
              }
            } : s
          );
          
          setSettlements(updatedSettlements);
          setShowPaymentModal(false);
          setSelectedPayment(null);
          setIsProcessingPayment(false);
          alert('✓ Demo payment successful!');
        }, 2000);
      } else {
        alert('Payment error: ' + error.message);
        setIsProcessingPayment(false);
      }
    }
  };
  // Analytics: Calculate spending insights with chart data
const getSpendingAnalytics = () => {
  if (!selectedGroup) return null;
  
  const groupExpenses = expenses.filter(e => e.groupId === selectedGroup.id);
  
  // Monthly spending for line chart
  const monthlyData = {};
  groupExpenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        total: 0
      };
    }
    monthlyData[monthYear].total += expense.amount;
  });

  // Category spending for pie chart
  const categoryData = {};
  groupExpenses.forEach(expense => {
    if (!categoryData[expense.category]) {
      categoryData[expense.category] = 0;
    }
    categoryData[expense.category] += expense.amount;
  });

  // Who paid the most for bar chart
  const memberPayments = {};
  groupExpenses.forEach(expense => {
    expense.paidBy.forEach(payer => {
      if (!memberPayments[payer.name]) {
        memberPayments[payer.name] = 0;
      }
      memberPayments[payer.name] += parseFloat(payer.amount);
    });
  });

  return {
    monthlySpending: Object.values(monthlyData).sort((a, b) => a.label.localeCompare(b.label)),
    categorySpending: Object.entries(categoryData)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    topPayers: Object.entries(memberPayments)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
    totalGroupSpending: groupExpenses.reduce((sum, e) => sum + e.amount, 0),
    expenseCount: groupExpenses.length
  };
};

// Initialize charts
const initializeCharts = (analytics) => {
  // Destroy existing charts
  Object.values(chartRefs.current).forEach(chart => {
    if (chart) chart.destroy();
  });
  chartRefs.current = {};

  // Category Pie Chart
  const categoryCtx = document.getElementById('categoryChart');
  if (categoryCtx && analytics.categorySpending.length > 0) {
    const categoryColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    chartRefs.current.categoryChart = new Chart(categoryCtx, {
      type: 'pie',
      data: {
        labels: analytics.categorySpending.map(item => item.category),
        datasets: [{
          data: analytics.categorySpending.map(item => item.amount),
          backgroundColor: categoryColors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const total = analytics.categorySpending.reduce((sum, item) => sum + item.amount, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ₹${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Monthly Trend Line Chart
  const monthlyCtx = document.getElementById('monthlyChart');
  if (monthlyCtx && analytics.monthlySpending.length > 0) {
    chartRefs.current.monthlyChart = new Chart(monthlyCtx, {
      type: 'line',
      data: {
        labels: analytics.monthlySpending.map(item => item.label),
        datasets: [{
          label: 'Monthly Spending',
          data: analytics.monthlySpending.map(item => item.total),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `₹${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        }
      }
    });
  }

  // Top Payers Bar Chart
  const payersCtx = document.getElementById('payersChart');
  if (payersCtx && analytics.topPayers.length > 0) {
    chartRefs.current.payersChart = new Chart(payersCtx, {
      type: 'bar',
      data: {
        labels: analytics.topPayers.map(item => item.name),
        datasets: [{
          label: 'Amount Paid',
          data: analytics.topPayers.map(item => item.amount),
          backgroundColor: [
            '#FFD700', '#C0C0C0', '#CD7F32', '#4BC0C0', '#9966FF'
          ],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `₹${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        }
      }
    });
  }
};

// Cleanup charts when modal closes
useEffect(() => {
  if (!showAnalytics) {
    Object.values(chartRefs.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    chartRefs.current = {};
  }
}, [showAnalytics]);

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      groupId: selectedGroup.id,
      userId: currentUser.id,
      userName: currentUser.name,
      message: chatMessage.trim(),
      date: new Date().toISOString()
    };
    
    setChatMessage('');
    alert('💬 Message sent: ' + message.message);
  };

  // Calculate who owes whom for each expense
  const calculateOwedAmounts = (expense) => {
    const owedAmounts = [];
    
    expense.splitDetails.forEach(split => {
      const paidByUser = expense.paidBy.find(p => p.userId === split.userId);
      const amountPaid = paidByUser ? parseFloat(paidByUser.amount) : 0;
      const amountOwed = parseFloat(split.amount);
      
      // If user paid more than they owe, they don't owe anything
      // If user paid less than they owe, they owe the difference
      const netOwed = Math.max(0, amountOwed - amountPaid);
      
      if (netOwed > 0.01) {
        owedAmounts.push({
          fromUserId: split.userId,
          fromName: split.name,
          amount: netOwed
        });
      }
    });
    
    return owedAmounts;
  };

  // Analytics: Monthly expense breakdown
  const getMonthlyAnalytics = () => {
    if (!selectedGroup) return [];
    
    const groupExpenses = expenses.filter(e => e.groupId === selectedGroup.id);
    const monthlyData = {};
    
    groupExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          total: 0,
          categories: {}
        };
      }
      
      monthlyData[monthYear].total += expense.amount;
      
      if (!monthlyData[monthYear].categories[expense.category]) {
        monthlyData[monthYear].categories[expense.category] = 0;
      }
      monthlyData[monthYear].categories[expense.category] += expense.amount;
    });
    
    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
  };

  // Analytics: Category-wise spending
  const getCategoryAnalytics = () => {
    if (!selectedGroup) return [];
    
    const groupExpenses = expenses.filter(e => e.groupId === selectedGroup.id);
    const categoryData = {};
    
    groupExpenses.forEach(expense => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = 0;
      }
      categoryData[expense.category] += expense.amount;
    });
    
    return Object.entries(categoryData)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const monthlyAnalytics = getMonthlyAnalytics();
  const categoryAnalytics = getCategoryAnalytics();

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 w-full">
      
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 mb-4 text-white w-full">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-1">💸 Expense Splitter</h1>
              <p className="text-indigo-100">Hi, {currentUser.name}</p>
            </div>
            <button
              onClick={() => setShowManualContact(true)}
              className="bg-white text-indigo-600 px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-50 transition font-semibold"
            >
              <Plus size={18} />
              Add Contact
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4 ">
          <button
            onClick={() => setView('groups')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition ${
              view === 'groups' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                : 'bg-white text-gray-700'
            }`}
          >
            <Users className="inline mr-2" size={20} />
            Groups
          </button>
          <button
            onClick={() => selectedGroup && setView('expenses')}
            disabled={!selectedGroup}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition ${
              view === 'expenses' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                : 'bg-white text-gray-700'
            } ${!selectedGroup && 'opacity-50 cursor-not-allowed'}`}
          >
            <MessageCircle className="inline mr-2" size={20} />
            Activity
          </button>
          <button
            onClick={() => selectedGroup && setView('settlements')}
            disabled={!selectedGroup}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition ${
              view === 'settlements' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                : 'bg-white text-gray-700'
            } ${!selectedGroup && 'opacity-50 cursor-not-allowed'}`}
          >
            <Receipt className="inline mr-2" size={20} />
            Settle Up
          </button>
        </div>

        {view === 'groups' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Your Trip Groups</h2>
              <button
                onClick={() => setShowGroupForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-semibold hover:shadow-lg transition"
              >
                <Plus size={18} /> Create Group
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setView('expenses');
                  }}
                  className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-indigo-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.members.length} members</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {group.members.slice(0, 4).map((m, i) => (
                      <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">
                        {m.name}
                      </span>
                    ))}
                    {group.members.length > 4 && (
                      <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold">
                        +{group.members.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <Users size={48} className="text-indigo-600 mx-auto mb-3" />
                <p className="text-lg text-gray-600 mb-1">No groups yet</p>
                <p className="text-gray-500">Create a group before your trip!</p>
              </div>
            )}
          </div>
        )}

        {view === 'expenses' && selectedGroup && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedGroup.name}</h2>
                  <p className="text-sm text-gray-600">{selectedGroup.members.length} members · {expenses.filter(e => e.groupId === selectedGroup.id).length} expenses</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={recordOfflinePayment}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
                  >
                    💵 Record Cash
                  </button>
                  <button
       onClick={() => setShowAnalytics(true)}
        disabled={expenses.filter(e => e.groupId === selectedGroup.id).length === 0}
        className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition ${
       expenses.filter(e => e.groupId === selectedGroup.id).length === 0 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:shadow-lg'
       }`}>
        <BarChart3 size={18} /> Analytics
        </button>
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold hover:shadow-lg transition"
                  >
                    <Plus size={18} /> Add Expense
                  </button>
                </div>
              </div>

              {/* Analytics Section */}
              {expenses.filter(e => e.groupId === selectedGroup.id).length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Analytics */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <BarChart3 size={18} />
                      Monthly Spending
                    </h3>
                    <div className="space-y-2">
                      {monthlyAnalytics.slice(0, 3).map((monthData, index) => (
                        <div key={index} className="bg-white rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm text-gray-800">{monthData.month}</span>
                            <span className="font-bold text-blue-600">₹{monthData.total.toFixed(2)}</span>
                          </div>
                          <div className="space-y-1">
                            {Object.entries(monthData.categories)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3)
                              .map(([category, amount]) => (
                                <div key={category} className="flex justify-between text-xs">
                                  <span className="text-gray-600">{category}</span>
                                  <span className="font-semibold">₹{amount.toFixed(2)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Analytics */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                    <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                      <BarChart3 size={18} />
                      Top Categories
                    </h3>
                    <div className="space-y-2">
                      {categoryAnalytics.slice(0, 5).map((catData, index) => (
                        <div key={index} className="bg-white rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm text-gray-800">{catData.category}</span>
                            <span className="font-bold text-purple-600">₹{catData.amount.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(catData.amount / categoryAnalytics[0]?.amount) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat-style Activity Feed */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-600" />
                  Activity Feed - Who Paid & Who Owes
                </h3>
              </div>
              
              <div className="p-4 space-y-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {expenses.filter(e => e.groupId === selectedGroup.id).length === 0 && 
                 offlinePayments.filter(p => p.groupId === selectedGroup.id).length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <MessageCircle size={40} className="mx-auto mb-2 text-gray-400" />
                    <p>No activity yet. Add your first expense!</p>
                  </div>
                )}

                {/* Expense Messages */}
                {expenses.filter(e => e.groupId === selectedGroup.id).map(expense => {
                  const owedAmounts = calculateOwedAmounts(expense);
                  
                  return (
                    <div key={expense.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-600 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-xs text-blue-700 font-bold uppercase mb-1">{expense.category}</p>
                          <p className="font-bold text-gray-800 text-lg mb-1">{expense.description}</p>
                          <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleString()}</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">₹{expense.amount}</p>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Who Paid */}
                        <div className="bg-white bg-opacity-70 rounded-lg p-3">
                          <p className="text-xs font-bold text-gray-600 mb-2">💳 WHO PAID:</p>
                          {expense.paidBy.map((payer, idx) => (
                            <div key={idx} className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                {payer.paymentMode === 'online' ? <CreditCard size={14} className="text-green-600" /> : <Wallet size={14} className="text-orange-600" />}
                                {payer.name}
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                ₹{payer.amount} {payer.paymentMode === 'offline' && '(Cash)'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Who Owes Whom */}
                        {owedAmounts.length > 0 && (
                          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-orange-700 mb-2">⚖️ WHO OWES:</p>
                            {owedAmounts.map((owed, idx) => (
                              <div key={idx} className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-orange-800">{owed.fromName}</span>
                                <span className="text-sm font-bold text-orange-600">owes ₹{owed.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No One Owes Message */}
                        {owedAmounts.length === 0 && (
                          <div className="bg-green-100 border-2 border-green-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-green-700 text-center">
                              ✅ All settled! Everyone has paid their share.
                            </p>
                          </div>
                        )}

                        {/* Smart Analysis */}
                        <div className="bg-green-100 rounded-lg p-2 mt-2">
                          <p className="text-xs text-green-800 font-semibold">
                            💡 {expense.paidBy.map(p => `${p.name} paid ₹${p.amount}`).join(', ')} for {expense.splitDetails.length} people
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Offline Payment Messages */}
                {offlinePayments.filter(p => p.groupId === selectedGroup.id).map(payment => (
                  <div key={payment.id} className={`p-4 rounded-xl border-l-4 shadow-sm ${
                    payment.status === 'approved' ? 'bg-green-50 border-green-600' :
                    payment.status === 'rejected' ? 'bg-red-50 border-red-600' :
                    'bg-yellow-50 border-yellow-600'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold uppercase text-orange-600 mb-1">💵 CASH PAYMENT</p>
                        <p className="font-bold text-gray-800 text-lg">
                          {payment.fromName} → {payment.toName}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">₹{payment.amount}</p>
                    </div>
                    
                    {payment.note && (
                      <p className="text-sm text-gray-600 mb-2 bg-white bg-opacity-50 rounded p-2">📝 {payment.note}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleString()}</p>
                      
                      {payment.status === 'pending' && payment.to === currentUser.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveOfflinePayment(payment.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 transition"
                          >
                            <Check size={12} className="inline" /> Approve
                          </button>
                          <button
                            onClick={() => rejectOfflinePayment(payment.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700 transition"
                          >
                            <XCircle size={12} className="inline" /> Reject
                          </button>
                        </div>
                      )}
                      
                      {payment.status === 'pending' && payment.to !== currentUser.id && (
                        <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Clock size={12} /> Waiting Approval
                        </span>
                      )}
                      
                      {payment.status === 'approved' && (
                        <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <CheckCircle size={12} /> Approved
                        </span>
                      )}
                      
                      {payment.status === 'rejected' && (
                        <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Send a message to the group..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>

            {expenses.filter(e => e.groupId === selectedGroup.id).length > 0 && (
              <button
                onClick={calculateSmartSettlements}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Receipt size={20} />
                Calculate Smart Settlement (Minimal Transactions)
              </button>
            )}
          </div>
        )}

        {view === 'settlements' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-5 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-1">💳 Smart Settlement</h2>
              <p className="text-purple-100">Optimized for minimal transactions</p>
              <p className="text-xs text-purple-200 mt-1">
                Only those who still owe money need to pay
              </p>
            </div>

            {settlements.filter(s => s.status === 'completed').length === settlements.length && settlements.length > 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <CheckCircle size={60} className="text-green-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-gray-800 mb-1">All Settled! 🎉</p>
                <p className="text-gray-500">Everyone's balanced up</p>
              </div>
            )}

            {settlements.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <Receipt size={48} className="text-gray-400 mx-auto mb-3" />
                <p className="text-lg text-gray-600">No settlements to show</p>
                <p className="text-sm text-gray-500">Add expenses first to calculate settlements</p>
              </div>
            )}

            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-3">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                How Settlement Works:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• If you already paid your share, you don't need to pay again</li>
                <li>• Only people who haven't paid their share will owe money</li>
                <li>• Transactions are optimized to minimize number of payments</li>
                <li>• Example: If 3 people split ₹3000 and 2 already paid, only 1 owes money</li>
              </ul>
            </div>

            {settlements.map(settlement => (
              <div key={settlement.id} className={`bg-white p-5 rounded-xl shadow-md border-2 ${
                settlement.status === 'completed' ? 'border-green-400 opacity-70' : 'border-purple-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {settlement.status === 'completed' ? (
                        <CheckCircle size={24} className="text-green-600" />
                      ) : (
                        <AlertCircle size={24} className="text-orange-600" />
                      )}
                      <p className="text-lg">
                        <span className="font-bold text-gray-800">{settlement.fromName}</span>
                        <span className="text-gray-600 mx-2">needs to pay</span>
                        <span className="font-bold text-gray-800">{settlement.toName}</span>
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 mb-2">₹{settlement.amount}</p>
                    
                    <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 inline-block">
                      💡 This is the remaining balance after considering all payments
                    </p>
                    
                    {settlement.status === 'completed' && settlement.proof && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700 font-semibold">
                          ✓ Paid via Cashfree: {settlement.proof.transactionId}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {new Date(settlement.proof.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {settlement.from === currentUser.id && settlement.status === 'pending' && (
                    <button
                      onClick={() => initiateSettlementPayment(settlement)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition transform hover:scale-105"
                    >
                      Pay Now
                    </button>
                  )}
                  
                  {settlement.status === 'completed' && (
                    <div className="bg-green-100 px-6 py-3 rounded-xl">
                      <span className="text-green-700 font-bold text-lg">✓ Paid</span>
                    </div>
                  )}
                  
                  {settlement.status === 'pending' && settlement.from !== currentUser.id && (
                    <div className="bg-yellow-100 px-6 py-3 rounded-xl">
                      <span className="text-yellow-700 font-bold">Waiting...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {settlements.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                <h3 className="font-bold text-green-800 mb-2">✨ Settlement Summary:</h3>
                <p className="text-sm text-green-700">
                  Total settlements needed: <span className="font-bold">{settlements.length}</span> transactions
                </p>
                <p className="text-sm text-green-700">
                  Total amount in circulation: <span className="font-bold">₹{settlements.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}</span>
                </p>
                <p className="text-xs text-green-600 mt-2 italic">
                  Our smart algorithm minimized the number of transactions needed!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Contact Modal */}
        {showManualContact && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Add Contact</h3>
                <button onClick={() => setShowManualContact(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Contact Name"
                value={manualContactData.name}
                onChange={(e) => setManualContactData({...manualContactData, name: e.target.value})}
                className="w-full p-3 border-2 border-gray-300 rounded-lg mb-3 focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Phone Number (+919876543210)"
                value={manualContactData.phone}
                onChange={(e) => setManualContactData({...manualContactData, phone: e.target.value})}
                className="w-full p-3 border-2 border-gray-300 rounded-lg mb-3 focus:border-indigo-500 focus:outline-none"
              />
              
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-700 font-semibold">
                  📋 Total contacts: {contacts.length}
                </p>
              </div>

              <button
                onClick={addManualContact}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition"
              >
                Add Contact
              </button>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showGroupForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Create Trip Group</h3>
                <button onClick={() => setShowGroupForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Group Name (e.g., Goa Trip 2025)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-indigo-500 focus:outline-none"
              />
              
              <div className="mb-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  <strong>Minimum 2 members required.</strong> Create group before your trip starts!
                </p>
              </div>

              <h4 className="font-bold mb-2 text-base">Select Members ({selectedMembers.length} selected)</h4>
              <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
                {contacts.map((contact) => (
                  <label key={contact.id} className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-lg cursor-pointer transition border-2 border-transparent hover:border-indigo-200">
                    <input
                      type="checkbox"
                      checked={selectedMembers.some(m => m.userId === contact.id)}
                      className="w-4 h-4 text-indigo-600"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, { userId: contact.id, name: contact.name, phone: contact.phone }]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(m => m.userId !== contact.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-sm">{contact.name}</span>
                      <p className="text-xs text-gray-500">{contact.phone}</p>
                    </div>
                  </label>
                ))}
                {contacts.length === 0 && (
                  <p className="text-gray-500 text-center py-4 text-sm">No contacts yet. Add contacts first!</p>
                )}
              </div>
              
              <button
                onClick={createGroup}
                disabled={selectedMembers.length < 2}
                className={`w-full py-3 rounded-lg font-bold transition ${
                  selectedMembers.length >= 2
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Create Group
              </button>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showExpenseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 z-10 border-b-2 border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">Add Expense</h3>
                <button onClick={() => setShowExpenseForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Category (e.g., Dinner, Auto, Hotel)"
                  value={expenseData.category}
                  onChange={(e) => setExpenseData({...expenseData, category: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
                
                <input
                  type="text"
                  placeholder="Description (e.g., Auto to Beach)"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
                
                <input
                  type="number"
                  placeholder="Total Amount (₹)"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />

                {/* Who Paid Section */}
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-semibold mb-3 text-base text-blue-900 flex items-center gap-2">
                    <Wallet size={18} />
                    Who Paid? (Multiple people can pay)
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedGroup.members.map((member) => (
                      <div key={member.userId} className="bg-white rounded-lg p-3">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={expenseData.paidBy.some(p => p.userId === member.userId)}
                            onChange={() => togglePaidBy(member.userId, member.name)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="font-semibold text-sm">{member.name}</span>
                        </label>
                        
                        {expenseData.paidBy.some(p => p.userId === member.userId) && (
                          <div className="ml-6 space-y-2">
                            <input
                              type="number"
                              placeholder="Amount paid"
                              value={expenseData.paidBy.find(p => p.userId === member.userId)?.amount || ''}
                              onChange={(e) => updatePaidBy(member.userId, 'amount', e.target.value)}
                              className="w-full p-2 border-2 border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input
                                  type="radio"
                                  checked={expenseData.paidBy.find(p => p.userId === member.userId)?.paymentMode === 'online'}
                                  onChange={() => updatePaidBy(member.userId, 'paymentMode', 'online')}
                                  className="w-4 h-4"
                                />
                                <CreditCard size={14} className="text-green-600" />
                                <span className="text-xs">Online</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input
                                  type="radio"
                                  checked={expenseData.paidBy.find(p => p.userId === member.userId)?.paymentMode === 'offline'}
                                  onChange={() => updatePaidBy(member.userId, 'paymentMode', 'offline')}
                                  className="w-4 h-4"
                                />
                                <Wallet size={14} className="text-orange-600" />
                                <span className="text-xs">Cash</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                    Total paid: ₹{expenseData.paidBy.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)} / ₹{expenseData.amount || 0}
                  </div>
                </div>

                {/* Split Section */}
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="font-semibold mb-3 text-base text-purple-900 flex items-center gap-2">
                    <Percent size={18} />
                    How to Split?
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      onClick={() => changeSplitType('equal')}
                      className={`p-2 rounded-lg font-semibold text-sm transition ${
                        expenseData.splitType === 'equal'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Equal
                    </button>
                    <button
                      onClick={() => changeSplitType('unequal')}
                      className={`p-2 rounded-lg font-semibold text-sm transition ${
                        expenseData.splitType === 'unequal'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Unequal
                    </button>
                    <button
                      onClick={() => changeSplitType('percentage')}
                      className={`p-2 rounded-lg font-semibold text-sm transition ${
                        expenseData.splitType === 'percentage'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      %
                    </button>
                  </div>

                  <h5 className="font-semibold mb-2 text-sm">Split Among:</h5>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {selectedGroup.members.map((member) => (
                      <label key={member.userId} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-purple-100 rounded-lg transition bg-white">
                        <input
                          type="checkbox"
                          checked={expenseData.splitAmong.some(s => s.userId === member.userId)}
                          onChange={() => toggleSplitAmong(member.userId, member.name)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="font-semibold text-sm">{member.name}</span>
                      </label>
                    ))}
                  </div>

                  {expenseData.splitType === 'equal' && expenseData.splitAmong.length > 0 && expenseData.amount && (
                    <div className="p-2 bg-white rounded text-sm text-purple-700 font-semibold">
                      ₹{(parseFloat(expenseData.amount) / expenseData.splitAmong.length).toFixed(2)} per person
                    </div>
                  )}

                  {expenseData.splitType === 'unequal' && expenseData.customSplits.length > 0 && (
                    <div className="space-y-2 bg-white rounded-lg p-3">
                      <p className="text-xs text-purple-700 font-semibold mb-2">Enter custom amounts:</p>
                      {expenseData.customSplits.map((split) => (
                        <div key={split.userId} className="flex items-center gap-2">
                          <span className="flex-1 text-sm font-semibold">{split.name}</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={split.amount}
                            onChange={(e) => updateCustomSplit(split.userId, 'amount', e.target.value)}
                            className="w-24 p-2 border-2 border-gray-300 rounded text-sm focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      ))}
                      <div className="p-2 bg-purple-100 rounded text-xs text-purple-700 mt-2">
                        Total: ₹{expenseData.customSplits.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0).toFixed(2)} / ₹{expenseData.amount || 0}
                      </div>
                    </div>
                  )}

                  {expenseData.splitType === 'percentage' && expenseData.customSplits.length > 0 && (
                    <div className="space-y-2 bg-white rounded-lg p-3">
                      <p className="text-xs text-purple-700 font-semibold mb-2">Enter percentages:</p>
                      {expenseData.customSplits.map((split) => (
                        <div key={split.userId} className="flex items-center gap-2">
                          <span className="flex-1 text-sm font-semibold">{split.name}</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={split.percentage}
                            onChange={(e) => updateCustomSplit(split.userId, 'percentage', e.target.value)}
                            className="w-20 p-2 border-2 border-gray-300 rounded text-sm focus:border-purple-500 focus:outline-none"
                          />
                          <span className="text-gray-600 text-sm">%</span>
                        </div>
                      ))}
                      <div className="p-2 bg-purple-100 rounded text-xs text-purple-700 mt-2">
                        Total: {expenseData.customSplits.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0).toFixed(2)}% / 100%
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={addExpense}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg transition"
                >
                  Add Expense & Track Payments
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal for Settlement */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Pay Settlement</h3>
                <button onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Paying to</p>
                <p className="text-xl font-bold text-gray-800 mb-2">{selectedPayment.toName}</p>
                <p className="text-sm text-gray-600 mb-3">UPI: {selectedPayment.toPhone}</p>
                <p className="text-4xl font-bold text-purple-600">₹{selectedPayment.amount}</p>
              </div>
              
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-800 font-semibold mb-1">
                    This is your remaining balance
                  </p>
                  <p className="text-xs text-green-700">
                    The system has already considered what you've paid. This is what you still owe.
                  </p>
                </div>
              </div>

              <button
                onClick={processSettlementPayment}
                disabled={isProcessingPayment}
                className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                  isProcessingPayment
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isProcessingPayment ? 'Processing Payment...' : `Pay ₹${selectedPayment.amount} via Cashfree`}
              </button>
            </div>
          </div>
        )}
        {/* Analytics Modal with Graphs */}
        {showAnalytics && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">📊 Spending Analytics - {selectedGroup.name}</h3>
        <button 
          onClick={() => setShowAnalytics(false)}
          className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X size={24} />
        </button>
        </div>

        {(() => {
        const analytics = getSpendingAnalytics();
        if (!analytics || analytics.expenseCount === 0) {
          return (
            <div className="text-center py-16">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No expense data available for analytics</p>
              <p className="text-sm text-gray-500 mt-2">Add some expenses to see spending patterns</p>
            </div>
          );
        }

        // Initialize charts when analytics data is ready
        setTimeout(() => initializeCharts(analytics), 100);

        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <p className="text-sm text-blue-700 font-semibold">Total Spending</p>
                <p className="text-2xl font-bold text-blue-800">₹{analytics.totalGroupSpending.toFixed(2)}</p>
                <p className="text-xs text-blue-600">{analytics.expenseCount} expenses</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <p className="text-sm text-green-700 font-semibold">Average Expense</p>
                <p className="text-2xl font-bold text-green-800">₹{(analytics.totalGroupSpending / analytics.expenseCount).toFixed(2)}</p>
                <p className="text-xs text-green-600">per expense</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <p className="text-sm text-purple-700 font-semibold">Top Category</p>
                <p className="text-2xl font-bold text-purple-800">{analytics.categorySpending[0]?.category || 'N/A'}</p>
                <p className="text-xs text-purple-600">₹{analytics.categorySpending[0]?.amount.toFixed(2) || '0'}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                <p className="text-sm text-orange-700 font-semibold">Top Contributor</p>
                <p className="text-2xl font-bold text-orange-800">{analytics.topPayers[0]?.name || 'N/A'}</p>
                <p className="text-xs text-orange-600">₹{analytics.topPayers[0]?.amount.toFixed(2) || '0'}</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category Pie Chart */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  🏷️ Spending by Category
                </h4>
                <div className="h-80">
                  <canvas id="categoryChart"></canvas>
                </div>
              </div>

              {/* Monthly Trend Line Chart */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  📈 Monthly Trends
                </h4>
                <div className="h-80">
                  <canvas id="monthlyChart"></canvas>
                </div>
              </div>

              {/* Top Payers Bar Chart */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  👑 Top Contributors
                </h4>
                <div className="h-80">
                  <canvas id="payersChart"></canvas>
                </div>
              </div>

              {/* Category Breakdown Details */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  📋 Category Breakdown
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analytics.categorySpending.map((category, index) => {
                    const percentage = (category.amount / analytics.totalGroupSpending) * 100;
                    return (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{
                            backgroundColor: [
                              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                              '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
                            ][index]
                          }}></div>
                          <span className="font-semibold text-gray-800">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">₹{category.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Insights Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
              <h4 className="font-bold text-lg text-indigo-800 mb-3 flex items-center gap-2">
                💡 Key Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-700">
                <div>
                  <p className="font-semibold mb-2">💰 Spending Patterns:</p>
                  <p>• Most spent on <strong>{analytics.categorySpending[0]?.category}</strong></p>
                  <p>• <strong>{analytics.topPayers[0]?.name}</strong> contributed the most</p>
                  <p>• Average expense: <strong>₹{(analytics.totalGroupSpending / analytics.expenseCount).toFixed(2)}</strong></p>
                </div>
                <div>
                  <p className="font-semibold mb-2">📊 Distribution:</p>
                  <p>• <strong>{analytics.categorySpending.length}</strong> different categories</p>
                  <p>• <strong>{analytics.topPayers.length}</strong> people contributed</p>
                  <p>• Top 3 categories make up <strong>
                    {((analytics.categorySpending.slice(0, 3).reduce((sum, item) => sum + item.amount, 0) / analytics.totalGroupSpending) * 100).toFixed(1)}%
                  </strong> of spending</p>
                </div>
              </div>
            </div>
          </div>
        );
       })()}
       </div>
        </div>
        )}
        </div>
        );
  };

export default ExpenseSplitterApp;
