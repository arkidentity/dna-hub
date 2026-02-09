/**
 * Pastor/Leader Landing Page for Spiritual Gifts Assessment
 *
 * Lead gen page offering team assessment access to pastors and church leaders.
 * Captures: name, email, church name, church size
 * Sends follow-up via Resend email sequence
 */

import SpiritualGiftsLeaderForm from '@/components/spiritual-gifts/SpiritualGiftsLeaderForm';

export const metadata = {
  title: 'Spiritual Gifts Assessment for Your Team | DNA Discipleship',
  description: 'Discover and develop your team\'s spiritual gifts with our comprehensive assessment. Perfect for pastors, church leaders, and ministry teams.',
};

export default function SpiritualGiftsLeadersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Equip Your Entire Team with<br />
            <span className="text-blue-600">Spiritual Gifts Discovery</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Help your church leaders and ministry teams discover their God-given gifts
            through our comprehensive 3-tier assessment based on Romans 12, 1 Corinthians 12,
            and Ephesians 4.
          </p>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Your Team Will Discover
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Serving Gifts
              </h3>
              <p className="text-gray-600 mb-4">
                Based on Romans 12 • 7 Gifts
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Prophecy</li>
                <li>• Serving</li>
                <li>• Teaching</li>
                <li>• Exhortation</li>
                <li>• Giving</li>
                <li>• Leadership</li>
                <li>• Mercy</li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100">
              <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Supernatural Gifts
              </h3>
              <p className="text-gray-600 mb-4">
                Based on 1 Corinthians 12 • 9 Gifts
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Wisdom</li>
                <li>• Knowledge</li>
                <li>• Faith</li>
                <li>• Healing</li>
                <li>• Miracles</li>
                <li>• Discernment</li>
                <li>• Tongues</li>
                <li>• Interpretation</li>
                <li>• Prophecy (Spirit)</li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl border border-indigo-100">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Leadership Calling
              </h3>
              <p className="text-gray-600 mb-4">
                Based on Ephesians 4 • 5 Offices
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Apostle</li>
                <li>• Prophet</li>
                <li>• Evangelist</li>
                <li>• Pastor</li>
                <li>• Teacher</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Designed for Church Leaders
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">96 Comprehensive Questions</h3>
                    <p className="text-gray-600">Scientifically validated assessment covering all three biblical tiers</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Instant Results PDF</h3>
                    <p className="text-gray-600">Each team member receives a personalized 2-page report</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Team Dashboard Access</h3>
                    <p className="text-gray-600">View and compare your entire team's spiritual gifts profile</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Growth Recommendations</h3>
                    <p className="text-gray-600">Practical guidance for developing each gift</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  Get Team Access
                </h3>
                <p className="text-gray-600 mb-6 text-center">
                  Fill out the form below and we'll send you access details for your entire team.
                </p>
                <SpiritualGiftsLeaderForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Perfect For
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl">
              <div className="text-4xl mb-3">⛪</div>
              <h3 className="font-bold text-gray-900 mb-2">Church Staff</h3>
              <p className="text-sm text-gray-600">Align your team's gifts with ministry roles</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-bold text-gray-900 mb-2">Small Groups</h3>
              <p className="text-sm text-gray-600">Help group leaders discover their calling</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-gray-900 mb-2">Ministry Teams</h3>
              <p className="text-sm text-gray-600">Build strategic, gift-based teams</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Equip Your Team?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of churches using DNA's Spiritual Gifts Assessment
            to develop leaders and build thriving ministry teams.
          </p>
          <a
            href="#form"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Today
          </a>
        </div>
      </section>
    </div>
  );
}
