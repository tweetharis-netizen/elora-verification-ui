const handleSubmit = async (e) => {
  e.preventDefault();
  setStatus('Sending...');

  try {
    const res = await fetch(`https://elora-website.vercel.app/api/send-verification?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (res.ok && data.success) {
      setStatus('✅ Email sent! Please check your inbox.');
    } else {
      setStatus('❌ ' + (data.error || 'Failed to send email.'));
    }
  } catch (err) {
    console.error('Send error:', err);
    setStatus('❌ ' + (err.message || 'Error sending email.'));
  }
};
