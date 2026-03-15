const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!;

const sendTelegram = async (message: string) => {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });
  const data = await res.json();
  if (!data.ok) console.error('Telegram error:', JSON.stringify(data));
};

Deno.serve(async (req) => {
  try {
    const { type, record } = await req.json();
    let message = '';

    if (type === 'low_stock') {
      message =
        `⚠️ <b>Low Stock Alert</b>\n\n` +
        `📦 <b>${record.name}</b> only has <b>${record.quantity}</b> item/s left.`;

    } else if (type === 'new_sale') {
      message =
        `🛒 <b>New Sale Recorded</b>\n\n` +
        `Order ID: <b>#${String(record.order_id).padStart(4, '0')}</b>\n` +
        `Customer: <b>${record.customer_name ?? 'Unknown'}</b>\n` +
        `Paid: <b>₱${Number(record.paid_amount).toFixed(2)}</b>\n` +
        `Balance: <b>₱${Number(record.remaining_balance).toFixed(2)}</b>`;

    } else if (type === 'payment_received') {
      message =
        `💳 <b>Payment Received</b>\n\n` +
        `<b>${record.customer_name ?? 'Customer'}</b> paid <b>₱${Number(record.payment_amount).toFixed(2)}</b>\n` +
        `toward Order <b>#${String(record.order_id).padStart(4, '0')}</b>\n` +
        `Remaining Balance: <b>₱${Number(record.remaining_balance).toFixed(2)}</b>`;

    } else if (type === 'debt_settled') {
      message =
        `✅ <b>Debt Settled</b>\n\n` +
        `Sale <b>#${String(record.order_id).padStart(4, '0')}</b> is now fully paid!\n` +
        `<b>${record.customer_name ?? 'Customer'}</b> paid the remaining balance ` +
        `(<b>₱${Number(record.payment_amount).toFixed(2)}</b>)\n` +
        `Total: <b>₱${Number(record.total_amount).toFixed(2)}</b>`;

    } else if (type === 'debt_cleared') {
      message =
        `🎉 <b>Customer Debt Cleared</b>\n\n` +
        `<b>${record.customer_name}</b> has fully cleared all outstanding debts!\n` +
        `All orders have been paid in full.`;

    } else if (type === 'stock_received') {
      message =
        `📦 <b>Stock Received</b>\n\n` +
        `Expense ID: <b>EXP-${String(record.expense_id).padStart(4, '0')}</b>\n` +
        `Supplier: <b>${record.supplier_name ?? 'Unknown'}</b>\n` +
        `Amount: <b>₱${Number(record.amount).toFixed(2)}</b>\n\n` +
        `✅ Stock has been marked as <b>Received</b>.`;
    }

    if (message) await sendTelegram(message);
    return new Response('ok', { status: 200 });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response('error', { status: 500 });
  }
});