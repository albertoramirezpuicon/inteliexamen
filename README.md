# Inteliexamen Platform

An AI-powered educational assessment platform with multi-role support (Admin, Teacher, Student) built with Next.js, TypeScript, and MySQL.

## 🚀 Features

- **Multi-role System**: Admin, Teacher, and Student interfaces
- **AI-Powered Assessments**: Intelligent question generation and evaluation
- **Internationalization**: Support for multiple languages (English/Spanish)
- **Real-time Analytics**: Comprehensive dashboard with insights
- **Email Integration**: Password reset and notifications via Resend
- **Responsive Design**: Modern UI with Material-UI components
- **Database Management**: Prisma ORM with MySQL
- **Security**: JWT authentication and role-based access control

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Material-UI v7
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL 8.0
- **Authentication**: JWT with NextAuth.js
- **Email**: Resend
- **Internationalization**: next-intl
- **Deployment**: Docker, Docker Compose, Nginx
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose
- Git

## ⚠️ Important Notes

### GitHub Actions Workflow
- **DO NOT MODIFY** the `.github/workflows/deploy.yml` file
- This file is managed by the user and contains custom deployment logic
- Any changes to deployment configuration should be made by the user directly

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/inteliexamen-platform.git
   cd inteliexamen-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Deployment

#### Option 1: Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

2. **Access the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

#### Option 2: EC2 Deployment

1. **Set up EC2 instance**
   ```bash
   # Upload and run the setup script
   chmod +x scripts/setup-ec2.sh
   sudo ./scripts/setup-ec2.sh
   ```

2. **Clone repository and deploy**
   ```bash
   cd /opt/inteliexamen
   git clone https://github.com/your-username/inteliexamen-platform.git .
   cp env.example .env
   # Edit .env with production values
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

#### Option 3: GitHub Actions CI/CD

1. **Set up GitHub Secrets**
   - `EC2_HOST`: Your EC2 instance IP
   - `EC2_SSH_KEY`: Your private SSH key
   - `DATABASE_URL`: Production database URL
   - `RESEND_API_KEY`: Your Resend API key
   - `JWT_SECRET`: Your JWT secret
   - `NEXTAUTH_SECRET`: Your NextAuth secret
   - `NEXTAUTH_URL`: Your production URL
   - `DB_ROOT_PASSWORD`: Database root password
   - `DB_NAME`: Database name
   - `DB_USER`: Database user
   - `DB_PASSWORD`: Database password

2. **Push to master branch**
   ```bash
   git push origin master
   ```

## 📁 Project Structure

```
inteliexamen-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── admin/         # Admin interface
│   │   │   ├── teacher/       # Teacher interface
│   │   │   ├── student/       # Student interface
│   │   │   └── page.tsx       # Landing page
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and configurations
│   ├── messages/              # Translation files
│   └── styles/                # Global styles
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
├── scripts/                   # Deployment and setup scripts
├── .github/workflows/         # CI/CD workflows
├── docker-compose.yml         # Docker configuration
├── Dockerfile                 # Docker image definition
└── nginx.conf                 # Nginx configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/inteliexamen"
DB_ROOT_PASSWORD="your_root_password"
DB_NAME="inteliexamen"
DB_USER="inteliexamen_user"
DB_PASSWORD="your_db_password"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# Email
RESEND_API_KEY="re_your_resend_api_key_here"
```

### Database Setup

1. **Create MySQL database**
   ```sql
   CREATE DATABASE inteliexamen;
   CREATE USER 'inteliexamen_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON inteliexamen.* TO 'inteliexamen_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Run migrations**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring

### Health Check
- **Endpoint**: `/api/health`
- **Purpose**: Monitor application and database status

### Logs
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# Nginx logs
docker-compose logs -f nginx
```

### Monitoring Script
The EC2 setup includes automatic monitoring that:
- Checks container status every 5 minutes
- Restarts failed containers
- Performs health checks
- Logs issues to `/var/log/inteliexamen-monitor.log`

## 🔒 Security

- **Authentication**: JWT-based with role-based access control
- **Rate Limiting**: API endpoints protected against abuse
- **HTTPS**: SSL/TLS encryption with Let's Encrypt
- **Firewall**: UFW configured for production
- **Database**: Secure MySQL configuration
- **Secrets**: Environment variables for sensitive data

## 📈 Performance

- **Caching**: Static assets cached with appropriate headers
- **Compression**: Gzip compression enabled
- **CDN Ready**: Static files optimized for CDN deployment
- **Database**: Optimized queries with Prisma
- **Images**: Optimized with Next.js Image component

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [CHANGELOG.md](CHANGELOG.md) for recent updates
- **Issues**: Report bugs and feature requests on GitHub
- **Lessons Learned**: Check [LESSONS_LEARNED.md](LESSONS_LEARNED.md) for common solutions

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Firewall rules set
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline tested
- [ ] Performance testing completed
- [ ] Security audit performed

---

**Inteliexamen Platform** - Empowering education through AI-powered assessments.