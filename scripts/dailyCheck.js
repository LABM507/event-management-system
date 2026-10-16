const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Firebase Admin SDK Configuration
// These credentials should be set as environment variables in GitHub Actions
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Email Configuration (using Resend or Nodemailer with SMTP)
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

const adminEmail = process.env.ADMIN_EMAIL;
const fromEmail = process.env.FROM_EMAIL || 'noreply@system.com';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Get today's date range (UTC)
function getTodayRange() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  return { startOfDay, endOfDay };
}

// Generate daily report HTML for admin
function generateDailyReportHTML(createdToday, resolvedToday, openReports) {
  const createdCount = createdToday.length;
  const resolvedCount = resolvedToday.length;
  const openCount = openReports.length;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-number { font-size: 36px; font-weight: bold; color: #667eea; }
    .metric-label { color: #666; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f5f5f5; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-open { background: #fee2e2; color: #dc2626; }
    .badge-inprogress { background: #fef3c7; color: #d97706; }
    .badge-resolved { background: #dbeafe; color: #2563eb; }
    .badge-closed { background: #dcfce7; color: #16a34a; }
    .severity-high { background: #fee2e2; color: #dc2626; }
    .severity-medium { background: #fef3c7; color: #d97706; }
    .severity-low { background: #dcfce7; color: #16a34a; }
    .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte Diario de Eventos</h1>
      <p>Resumen de incidentes en cámaras y equipos de red</p>
      <p style="margin-top: 10px; opacity: 0.9;">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div class="content">
      <div class="metrics">
        <div class="metric-card">
          <div class="metric-number">${createdCount}</div>
          <div class="metric-label">Nuevos Hoy</div>
        </div>
        <div class="metric-card">
          <div class="metric-number">${resolvedCount}</div>
          <div class="metric-label">Resueltos Hoy</div>
        </div>
        <div class="metric-card">
          <div class="metric-number">${openCount}</div>
          <div class="metric-label">Abiertos Totales</div>
        </div>
      </div>

      ${createdCount > 0 ? `
      <div class="section-title">📝 Eventos Creados Hoy (${createdCount})</div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Severidad</th>
            <th>Operador</th>
          </tr>
        </thead>
        <tbody>
          ${createdToday.map(r => `
            <tr>
              <td>${r.id.substring(0, 8)}...</td>
              <td>${r.type}</td>
              <td>${r.location}</td>
              <td><span class="badge severity-${r.severity.toLowerCase()}">${r.severity}</span></td>
              <td>${r.operatorEmail}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${resolvedCount > 0 ? `
      <div class="section-title">✅ Eventos Resueltos Hoy (${resolvedCount})</div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Operador</th>
            <th>Tiempo Resolución</th>
          </tr>
        </thead>
        <tbody>
          ${resolvedToday.map(r => {
            const resolutionTime = r.resolvedAt && r.createdAt 
              ? Math.round((r.resolvedAt.toDate() - r.createdAt.toDate()) / (1000 * 60 * 60))
              : 'N/A';
            return `
              <tr>
                <td>${r.id.substring(0, 8)}...</td>
                <td>${r.type}</td>
                <td>${r.location}</td>
                <td>${r.operatorEmail}</td>
                <td>${resolutionTime}h</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ` : ''}

      ${openCount > 0 ? `
      <div class="section-title">⚠️ Eventos Abiertos (${openCount})</div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Severidad</th>
            <th>Estado</th>
            <th>Días Abierto</th>
          </tr>
        </thead>
        <tbody>
          ${openReports.map(r => {
            const daysOpen = r.createdAt 
              ? Math.floor((new Date() - r.createdAt.toDate()) / (1000 * 60 * 60 * 24))
              : 0;
            const statusClass = r.status === 'Abierto' ? 'badge-open' : 
                               r.status === 'En Proceso' ? 'badge-inprogress' : 
                               r.status === 'Resuelto' ? 'badge-resolved' : 'badge-closed';
            return `
              <tr>
                <td>${r.id.substring(0, 8)}...</td>
                <td>${r.type}</td>
                <td>${r.location}</td>
                <td><span class="badge severity-${r.severity.toLowerCase()}">${r.severity}</span></td>
                <td><span class="badge ${statusClass}">${r.status}</span></td>
                <td>${daysOpen}d</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ` : ''}

      <div class="footer">
        <p>Este reporte se genera automáticamente cada día a medianoche.</p>
        <p>Sistema de Gestión de Eventos - Cámaras y Red</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Generate 24-hour follow-up email for operator
function generateFollowUpHTML(report, isOpen) {
  const daysOpen = report.createdAt 
    ? Math.floor((new Date() - report.createdAt.toDate()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isOpen) {
    // ALERT email for open reports
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert-header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; border: 2px solid #dc2626; }
    .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; margin: 10px 0; }
    .info-label { font-weight: bold; width: 150px; color: #666; }
    .info-value { color: #333; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .severity-high { background: #fee2e2; color: #dc2626; }
    .severity-medium { background: #fef3c7; color: #d97706; }
    .severity-low { background: #dcfce7; color: #16a34a; }
    .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert-header">
      <h1>⚠️ ALERTA: Seguimiento Requerido</h1>
      <p>Su reporte lleva ${daysOpen} días sin resolución</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <strong>IMPORTANTE:</strong> El incidente que reportó sigue ABIERTO y requiere su atención inmediata. Por favor actualice el estado o proporcione más información.
      </div>

      <h3>Detalles del Reporte</h3>
      <div class="info-row">
        <span class="info-label">ID:</span>
        <span class="info-value">${report.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tipo:</span>
        <span class="info-value">${report.type}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Ubicación:</span>
        <span class="info-value">${report.location}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Severidad:</span>
        <span class="info-value"><span class="badge severity-${report.severity.toLowerCase()}">${report.severity}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Estado Actual:</span>
        <span class="info-value">${report.status}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fecha Creación:</span>
        <span class="info-value">${report.createdAt ? report.createdAt.toDate().toLocaleString('es-ES') : 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Días Abierto:</span>
        <span class="info-value" style="color: #dc2626; font-weight: bold;">${daysOpen} días</span>
      </div>

      <h3>Descripción del Problema</h3>
      <p style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">${report.description}</p>

      <p style="margin-top: 20px;">
        Por favor ingrese al sistema para actualizar el estado de este incidente o agregar comentarios adicionales.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  } else {
    // Confirmation email for resolved reports
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .success-header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; border: 2px solid #16a34a; }
    .success-box { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; margin: 10px 0; }
    .info-label { font-weight: bold; width: 150px; color: #666; }
    .info-value { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-header">
      <h1>✅ Confirmación de Cierre</h1>
      <p>Su reporte ha sido resuelto</p>
    </div>
    
    <div class="content">
      <div class="success-box">
        <strong>Excelente:</strong> El incidente que reportó ha sido marcado como RESUELTO/CERRADO. Gracias por su colaboración.
      </div>

      <h3>Detalles del Reporte</h3>
      <div class="info-row">
        <span class="info-label">ID:</span>
        <span class="info-value">${report.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tipo:</span>
        <span class="info-value">${report.type}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Ubicación:</span>
        <span class="info-value">${report.location}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Estado Final:</span>
        <span class="info-value" style="color: #16a34a; font-weight: bold;">${report.status}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fecha Resolución:</span>
        <span class="info-value">${report.resolvedAt ? report.resolvedAt.toDate().toLocaleString('es-ES') : 'N/A'}</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

// Main function
async function main() {
  console.log('Starting daily check at:', new Date().toISOString());

  try {
    const { startOfDay, endOfDay } = getTodayRange();

    // Get reports created today
    const createdTodaySnapshot = await db.collection('reports')
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<', endOfDay)
      .get();
    
    const createdToday = createdTodaySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Reports created today: ${createdToday.length}`);

    // Get reports resolved today
    const resolvedTodaySnapshot = await db.collection('reports')
      .where('resolvedAt', '>=', startOfDay)
      .where('resolvedAt', '<', endOfDay)
      .get();
    
    const resolvedToday = resolvedTodaySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Reports resolved today: ${resolvedToday.length}`);

    // Get all open reports
    const openReportsSnapshot = await db.collection('reports')
      .where('status', 'in', ['Abierto', 'En Proceso'])
      .get();
    
    const openReports = openReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Total open reports: ${openReports.length}`);

    // Send daily report to admin
    const dailyReportHTML = generateDailyReportHTML(createdToday, resolvedToday, openReports);
    
    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: `📊 Reporte Diario de Eventos - ${new Date().toLocaleDateString('es-ES')}`,
      html: dailyReportHTML
    });
    
    console.log('Daily report sent to admin successfully');

    // 24-hour follow-up check
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const report of openReports) {
      if (report.createdAt && report.createdAt.toDate() <= twentyFourHoursAgo) {
        console.log(`Checking 24h follow-up for report: ${report.id}`);
        
        const followUpHTML = generateFollowUpHTML(report, true);
        
        await transporter.sendMail({
          from: fromEmail,
          to: report.operatorEmail,
          subject: `⚠️ ALERTA: Seguimiento Requerido - Reporte ${report.id.substring(0, 8)}`,
          html: followUpHTML
        });
        
        console.log(`Follow-up email sent to ${report.operatorEmail}`);
      }
    }

    // Check resolved reports from 24h ago to send confirmation
    const resolvedSnapshot = await db.collection('reports')
      .where('resolvedAt', '>=', twentyFourHoursAgo)
      .where('resolvedAt', '<', new Date())
      .get();
    
    const resolvedReports = resolvedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const report of resolvedReports) {
      console.log(`Sending confirmation for resolved report: ${report.id}`);
      
      const confirmationHTML = generateFollowUpHTML(report, false);
      
      await transporter.sendMail({
        from: fromEmail,
        to: report.operatorEmail,
        subject: `✅ Confirmación de Cierre - Reporte ${report.id.substring(0, 8)}`,
        html: confirmationHTML
      });
      
      console.log(`Confirmation email sent to ${report.operatorEmail}`);
    }

    console.log('Daily check completed successfully');
  } catch (error) {
    console.error('Error in daily check:', error);
    throw error;
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
