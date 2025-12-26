export function getLandingPageStructuredData() {
  const baseUrl = 'https://trainpulse.fit'
  const logoUrl = `${baseUrl}/icons/icon-512x512.png`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}#organization`,
        name: 'TrainPulse',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
          width: 512,
          height: 512,
        },
        description:
          'The all-in-one personal trainer software for fitness professionals in the USA. Manage clients, schedules, workouts, and payments effortlessly.',
        sameAs: [
          // Add social media links here when available
          // 'https://twitter.com/trainpulse',
          // 'https://facebook.com/trainpulse',
          // 'https://linkedin.com/company/trainpulse',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          availableLanguage: 'English',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}#software`,
        name: 'TrainPulse',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          priceValidUntil: '2026-12-31',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5.0',
          ratingCount: '1',
        },
        description:
          'Personal trainer software and fitness business management platform. Manage clients, appointments, workouts, and payments all in one place.',
        screenshot: logoUrl,
        softwareVersion: '1.0',
        publisher: {
          '@id': `${baseUrl}#organization`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}#website`,
        url: baseUrl,
        name: 'TrainPulse',
        description:
          'Personal trainer software for fitness professionals. Manage your fitness business effortlessly.',
        publisher: {
          '@id': `${baseUrl}#organization`,
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}#webpage`,
        url: baseUrl,
        name: 'TrainPulse - Personal Trainer Software | Fitness Business Management',
        description:
          'The all-in-one personal trainer software for fitness professionals in the USA. Manage clients, schedules, workouts, and payments effortlessly.',
        isPartOf: {
          '@id': `${baseUrl}#website`,
        },
        about: {
          '@id': `${baseUrl}#organization`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: logoUrl,
        },
      },
    ],
  }
}

export function getFAQStructuredData() {
  const baseUrl = 'https://trainpulse.fit'

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is TrainPulse?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TrainPulse is a comprehensive personal trainer software and fitness business management platform designed specifically for fitness professionals. It helps trainers manage clients, schedules, workouts, and payments all in one place.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who can use TrainPulse?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TrainPulse is designed for personal trainers, fitness coaches, and independent fitness professionals who want to streamline their business operations. It\'s perfect for trainers managing their own clients and schedules.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to install software to use TrainPulse?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No installation required! TrainPulse is a web-based application that works in your browser. You can also install it as a Progressive Web App (PWA) on your mobile device or desktop for app-like experience and offline access.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I manage my clients and appointments with TrainPulse?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! TrainPulse includes comprehensive client management features where you can track client information, history, and engagement. You can also schedule appointments, manage your calendar, and set up automated reminders to never miss a session.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does TrainPulse work offline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, TrainPulse works offline! As a Progressive Web App, you can access your cached data even without an internet connection. Perfect for viewing client information and schedules when you\'re at the gym without WiFi.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get started with TrainPulse?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Getting started is easy! Simply create a free account, and you\'ll have immediate access to all features. You can start adding clients, creating workouts, and scheduling appointments right away.',
        },
      },
    ],
  }
}

