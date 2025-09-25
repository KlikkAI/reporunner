name: 'Sarah Johnson',
},
    ],
    html: 'Sarah Johnson &lt;customer@example.com&gt;',
    text: 'Sarah Johnson <customer@example.com>',
  },

  to:
{
  value: [
    {
      address: 'support@reporunner.com',
      name: 'RepoRunner Support',
    },
  ],
    html;
  : 'RepoRunner Support &lt;support@reporunner.com&gt;',
    text: 'RepoRunner Support <support@reporunner.com>',
}
,

  subject: 'Urgent: Damaged Package - Order #12345 - Need Return/Exchange',
  text: `Hi RepoRunner Support Team,

I hope this email finds you well. I'm writing to report an issue with my recent order #12345 that was delivered yesterday.

Problem Details:
- Order Number: #12345
- Delivery Date: January 3, 2025
- Issue: Package arrived
with significant damage
to;
the;
outer;
box;
and;
the;
product;
inside;

The;
product;
appears;
to;
have;
been;
damaged;
during;
shipping.The;
box;
was;
crushed;
on;
one;
side;
and;
the;
item;
inside;
has;
visible;
scratches;
and;
dents.I;
've attached photos showing the damage for your reference.

What I Need:
I would like to either:
1. Return the damaged item
for a full refund, OR  
2.
Exchange;
it;
for a replacement in good condition

I
('ve been a loyal customer for over 2 years and have always had great experiences with your service. I');
m;
hoping;
we;
can;
resolve;
this;
quickly.Please;
let me;
know;
what;
steps;
I;
need;
to;
take;
next.I;
'm available via email or phone (555-123-4567) if you need any additional information.

Thank you
for your time and assistance.

Best
regards, Sarah;
Johnson;
Customer;
ID: CUST - 98765;
Email: customer;
@example.com
Phone: 555;
123 -
  4567`,

  html: ` <
  div;
dir = 'ltr' > <p>Hi;
RepoRunner;
Support;
Team,</p>
    
    <p>I
hope;
this;
email;
finds;
you;
well.I;
'm writing to report an issue with my recent order <strong>#12345</strong> that was delivered yesterday.</p>
    
    <p><strong>Problem Details:</strong></p>
    <ul>
      <li>Order Number: #12345</li>
      <li>Delivery Date: January 3, 2025</li>
      <li>Issue: Package arrived
with significant damage
to;
the;
outer;
box;
and;
the;
product;
inside < />il < / > lu < p > The;
product;
appears;
to;
have;
been;
damaged;
during;
shipping.The;
box;
was;
crushed;
on;
one;
side;
and;
the;
item;
inside;
has;
visible;
scratches;
and;
dents.I;
've attached photos showing the damage for your reference.</p>
    
    <p><strong>What I Need:</strong><br>
    I would like to either:</p>
    <ol>
      <li>Return the damaged item
for a full refund, OR</li>
      <li>Exchange it
for a replacement in good condition</li>
    </ol>
    
    <p>I've been a loyal customer for over 2 years and have always had great experiences with your service. I'
m;
hoping;
we;
can;
resolve;
this;
quickly.</p>
    
    <p>Please
let me;
know;
what;
steps;
I;
need;
to;
take;
next.I;
'm available via email or phone <a href="tel:5551234567">(555-123-4567)</a> if you need any additional information.</p>
    
    <p>Thank you
for your time and assistance.</p>
    
    <p>Best
regards, <br>Sarah;
Johnson<br>;
Customer;
ID: CUST - 98765<br>;
Email: <a href = 'mailto:customer@example.com' > customer;
@example.com
</a><br>
Phone: 555;
123 - 4567 < />p < /,>`div;

date: '2025-01-04T09:15:30.000Z', receivedAt;
: '2025-01-04T09:15:30.000Z',
  messageId: '<CACUhAm9F2KfQ1234567890@mail.gmail.com>',

  headers:
{
  ('Return-Path');
  : '<customer@example.com>',
    Received: 'from mail-wr1-f43.google.com by mx.reporunner.com',
    'DKIM-Signature': 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com',
    'Message-ID': '<CACUhAm9F2KfQ1234567890@mail.gmail.com>',
    Date: 'Fri, 4 Jan 2025 09:15:30 +0000',
    From: 'Sarah Johnson <customer@example.com>',
    To: 'RepoRunner Support <support@reporunner.com>',
    Subject: 'Urgent: Damaged Package - Order #12345 - Need Return/Exchange',
    'Content-Type': 'multipart/alternative; boundary="000000000000a1b2c3d4e5f6"',
}
,

  attachments: [
{
      contentDisposition: 'attachment',
