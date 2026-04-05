import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/home" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: December 19, 2024</p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mt-4">
              By accessing or using the Elite E-Commerce platform (the "Service"), 
              you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of 
              the terms, you may not access the Service. These Terms apply to all visitors, users, and 
              others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">2. Description of Service</h2>
            <p className="text-muted-foreground mt-4">
              Our Service provides an education and performance tracking platform for e-commerce entrepreneurs. 
              The Service includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Access to structured courses and learning modules</li>
              <li>Task tracking and progress monitoring</li>
              <li>Community features and direct messaging</li>
              <li>Calendar and coaching call scheduling</li>
              <li>Brand lead management tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">3. Account Registration</h2>
            <div className="mt-4 space-y-4">
              <p className="text-muted-foreground">
                To use certain features of the Service, you must register for an account. When you register, 
                you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">4. Platform Usage</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground">4.1 Content Access</h3>
                <p className="text-muted-foreground">
                  Access to courses, modules, and other content within the platform is determined by your 
                  membership tier. By using the Service, you agree to access only the content available 
                  to your tier level.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">4.2 Community Guidelines</h3>
                <p className="text-muted-foreground">
                  You acknowledge that your participation in community features is subject to our community 
                  guidelines. You agree to interact respectfully with other members and comply with all 
                  applicable policies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">4.3 Data Accuracy</h3>
                <p className="text-muted-foreground">
                  While we strive to provide accurate information and tracking, we do not guarantee the 
                  accuracy, completeness, or timeliness of any data displayed within the platform.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">5. User Responsibilities</h2>
            <p className="text-muted-foreground mt-4">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Use the Service to infringe on the rights of others</li>
              <li>Share your account credentials with third parties</li>
              <li>Use automated systems or bots to access the Service without permission</li>
              <li>Attempt to reverse engineer or extract source code from the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">6. Intellectual Property</h2>
            <p className="text-muted-foreground mt-4">
              The Service and its original content, features, and functionality are and will remain the 
              exclusive property of Elite E-Commerce and its licensors. The Service is protected by 
              copyright, trademark, and other laws. Our trademarks may not be used in connection with 
              any product or service without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">7. Disclaimer of Warranties</h2>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF 
                ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF 
                PERFORMANCE.
              </p>
              <p className="text-muted-foreground mt-4">
                We do not warrant that: (a) the Service will function uninterrupted, secure, or available 
                at any particular time or location; (b) any errors or defects will be corrected; (c) the 
                Service is free of viruses or other harmful components; or (d) the results of using the 
                Service will meet your requirements.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">8. Limitation of Liability</h2>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                IN NO EVENT SHALL ELITE E-COMMERCE, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, 
                OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
                DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER 
                INTANGIBLE LOSSES, RESULTING FROM: (a) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR 
                USE THE SERVICE; (b) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (c) ANY 
                CONTENT OBTAINED FROM THE SERVICE; AND (d) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR 
                TRANSMISSIONS OR CONTENT.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">9. Indemnification</h2>
            <p className="text-muted-foreground mt-4">
              You agree to defend, indemnify, and hold harmless Elite E-Commerce and its licensees and 
              licensors, and their employees, contractors, agents, officers, and directors, from and against 
              any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses, 
              including but not limited to attorney's fees, resulting from or arising out of: (a) your use 
              of the Service; (b) your violation of these Terms; (c) your violation of any third party right, 
              including any copyright, property, or privacy right.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">10. Termination</h2>
            <p className="text-muted-foreground mt-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for 
              any reason, including if you breach the Terms. Upon termination, your right to use the Service 
              will immediately cease. You may stop using the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">11. Changes to Terms</h2>
            <p className="text-muted-foreground mt-4">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, 
              we will try to provide at least 30 days notice prior to any new terms taking effect. What 
              constitutes a material change will be determined at our sole discretion. By continuing to 
              access or use our Service after those revisions become effective, you agree to be bound by 
              the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">12. Governing Law</h2>
            <p className="text-muted-foreground mt-4">
              These Terms shall be governed and construed in accordance with the laws of the United States, 
              without regard to its conflict of law provisions. Our failure to enforce any right or provision 
              of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">13. Contact Us</h2>
            <p className="text-muted-foreground mt-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-foreground font-medium">Elite E-Commerce</p>
              <p className="text-muted-foreground">Email: support@eliteecommerce.com</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link 
            to="/home" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;