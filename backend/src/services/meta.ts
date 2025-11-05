import axios from 'axios';

const META_API_VERSION = 'v24.0';
const META_GRAPH_API = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaOAuthResult {
  access_token: string;
  token_type: string;
}

export async function exchangeCodeForToken(code: string): Promise<MetaOAuthResult> {
  try {
    const response = await axios.get(`${META_GRAPH_API}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Meta OAuth error:', error);
    throw error;
  }
}

export async function getAdAccounts(accessToken: string): Promise<any[]> {
  try {
    const response = await axios.get(`${META_GRAPH_API}/me/adaccounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_status',
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Get ad accounts error:', error);
    throw error;
  }
}

export async function getPages(accessToken: string): Promise<any[]> {
  try {
    const response = await axios.get(`${META_GRAPH_API}/me/accounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token',
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Get pages error:', error);
    throw error;
  }
}

export interface CreateCampaignParams {
  accessToken: string;
  adAccountId: string;
  name: string;
  objective: string;
  status?: string;
}

export async function createCampaign(params: CreateCampaignParams): Promise<string> {
  const { accessToken, adAccountId, name, objective, status = 'PAUSED' } = params;

  try {
    const response = await axios.post(
      `${META_GRAPH_API}/${adAccountId}/campaigns`,
      {
        name,
        objective,
        status,
        special_ad_categories: [],
        is_adset_budget_sharing_enabled: false, // Required field - ad sets use individual budgets
      },
      {
        params: { access_token: accessToken },
      }
    );

    return response.data.id;
  } catch (error: any) {
    console.error('Create campaign error:', error.response?.data || error.message);
    throw error;
  }
}

export interface CreateAdSetParams {
  accessToken: string;
  adAccountId: string;
  campaignId: string;
  name: string;
  dailyBudget: number;
  targeting: any;
  optimizationGoal: string;
}

export async function createAdSet(params: CreateAdSetParams): Promise<string> {
  const {
    accessToken,
    adAccountId,
    campaignId,
    name,
    dailyBudget,
    targeting,
    optimizationGoal,
  } = params;

  try {
    const dailyBudgetCents = Math.round(dailyBudget * 100); // Convert to cents
    console.log(`Creating ad set with daily budget: $${dailyBudget} (${dailyBudgetCents} cents)`);

    const response = await axios.post(
      `${META_GRAPH_API}/${adAccountId}/adsets`,
      {
        name,
        campaign_id: campaignId,
        daily_budget: dailyBudgetCents,
        billing_event: 'IMPRESSIONS',
        optimization_goal: optimizationGoal,
        bid_amount: 200,
        targeting: {
          ...targeting,
          targeting_automation: {
            advantage_audience: 0, // Disable Advantage audience (use manual targeting)
          },
        },
        status: 'PAUSED',
      },
      {
        params: { access_token: accessToken },
      }
    );

    console.log('Ad set created successfully:', response.data.id);
    return response.data.id;
  } catch (error: any) {
    console.error('Create ad set error:', error.response?.data || error.message);
    throw error;
  }
}

export interface CreateAdParams {
  accessToken: string;
  adAccountId: string;
  adSetId: string;
  name: string;
  creativeId: string;
}

export async function createAd(params: CreateAdParams): Promise<string> {
  const { accessToken, adAccountId, adSetId, name, creativeId } = params;

  try {
    const response = await axios.post(
      `${META_GRAPH_API}/${adAccountId}/ads`,
      {
        name,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: 'PAUSED',
      },
      {
        params: { access_token: accessToken },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Create ad error:', error);
    throw error;
  }
}

export interface CreateAdCreativeParams {
  accessToken: string;
  adAccountId: string;
  pageId: string;
  name: string;
  headline: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  callToAction: string;
}

// Map user-friendly CTA text to valid Meta CTA types
function mapCallToActionType(cta: string): string {
  // Normalize the input
  const normalized = cta.toUpperCase().replace(/\s+/g, '_');

  // Valid Meta CTA types
  const validTypes = [
    'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'DOWNLOAD', 'GET_QUOTE', 'APPLY_NOW',
    'BOOK_NOW', 'CONTACT_US', 'GET_OFFER', 'SUBSCRIBE', 'BUY_NOW', 'GET_SHOWTIMES',
    'LISTEN_NOW', 'WATCH_VIDEO', 'WATCH_MORE', 'OPEN_LINK', 'NO_BUTTON',
    'CALL_NOW', 'INSTALL_APP', 'USE_APP', 'PLAY_GAME', 'SEE_MENU', 'ORDER_NOW'
  ];

  // Check if it's already valid
  if (validTypes.includes(normalized)) {
    return normalized;
  }

  // Mapping table for common variations
  const mappings: Record<string, string> = {
    // Shopping related
    'BUY': 'BUY_NOW',
    'PURCHASE': 'BUY_NOW',
    'SHOP': 'SHOP_NOW',
    'GET_STARTED': 'LEARN_MORE',
    'START': 'LEARN_MORE',
    'TRY_NOW': 'LEARN_MORE',
    'TRY_IT': 'LEARN_MORE',

    // Info related
    'LEARN': 'LEARN_MORE',
    'MORE_INFO': 'LEARN_MORE',
    'INFO': 'LEARN_MORE',
    'DISCOVER': 'LEARN_MORE',
    'EXPLORE': 'LEARN_MORE',
    'SEE_MORE': 'LEARN_MORE',
    'FIND_OUT_MORE': 'LEARN_MORE',

    // Action related
    'SIGN_UP': 'SIGN_UP',
    'REGISTER': 'SIGN_UP',
    'JOIN': 'SIGN_UP',
    'APPLY': 'APPLY_NOW',
    'GET_APP': 'DOWNLOAD',
    'DOWNLOAD_APP': 'DOWNLOAD',

    // Contact related
    'CONTACT': 'CONTACT_US',
    'CALL': 'CALL_NOW',
    'MESSAGE': 'CONTACT_US',
    'CHAT': 'CONTACT_US',

    // Booking related
    'BOOK': 'BOOK_NOW',
    'RESERVE': 'BOOK_NOW',
    'SCHEDULE': 'BOOK_NOW',

    // Advertising related - map to appropriate CTAs
    'BOOST_YOUR_ADS': 'LEARN_MORE',
    'BOOST_ADS': 'LEARN_MORE',
    'IMPROVE_ADS': 'LEARN_MORE',
    'OPTIMIZE_ADS': 'LEARN_MORE',
    'TRANSFORM_YOUR_ADS': 'LEARN_MORE',
    'TRANSFORM_ADS': 'LEARN_MORE',
  };

  // Try to find a mapping
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log(`Mapped CTA "${cta}" -> "${value}"`);
      return value;
    }
  }

  // Default fallback
  console.log(`No mapping found for CTA "${cta}", using default "LEARN_MORE"`);
  return 'LEARN_MORE';
}

export async function createAdCreative(params: CreateAdCreativeParams): Promise<string> {
  const { accessToken, adAccountId, pageId, name, headline, body, imageUrl, linkUrl, callToAction } = params;

  try {
    console.log('Creating ad creative:', { adAccountId, pageId, name, headline, linkUrl, callToAction });

    // Map the CTA to a valid Meta type
    const ctaType = mapCallToActionType(callToAction);

    // Create the ad creative with direct image URL (no need to upload to /adimages first)
    const creativeData = {
      name,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          picture: imageUrl, // Use picture URL directly instead of image_hash
          link: linkUrl,
          message: body,
          name: headline,
          call_to_action: {
            type: ctaType,
          },
        },
      },
    };

    console.log('Ad creative payload:', JSON.stringify(creativeData, null, 2));

    const response = await axios.post(
      `${META_GRAPH_API}/${adAccountId}/adcreatives`,
      creativeData,
      {
        params: { access_token: accessToken },
      }
    );

    console.log('Ad creative created successfully:', response.data.id);
    return response.data.id;
  } catch (error: any) {
    console.error('Create ad creative error:', error.response?.data || error.message);
    console.error('Full error:', JSON.stringify(error.response?.data, null, 2));

    // Check if this is the development mode restriction
    if (error.response?.data?.error?.error_subcode === 1885183) {
      throw new Error(
        'Ad creative creation failed: Your Meta app is in Development Mode. ' +
        'To create ad creatives, your app must be approved and in Live Mode. ' +
        'Submit your app for review at https://developers.facebook.com/apps/ ' +
        'and request the "ads_management" permission.'
      );
    }

    throw error;
  }
}

async function uploadAdImage(
  accessToken: string,
  adAccountId: string,
  imageUrl: string
): Promise<string> {
  // In sandbox mode, image upload may not be available due to app permissions
  // Use a test image hash if configured
  const isSandboxMode = !!process.env.META_SANDBOX_AD_ACCOUNT_ID;
  const testImageHash = process.env.META_TEST_IMAGE_HASH;

  if (isSandboxMode && testImageHash) {
    console.log('🧪 Using test image hash for sandbox mode:', testImageHash);
    return testImageHash;
  }

  try {
    console.log('Uploading image to Meta:', { adAccountId, imageUrl: imageUrl.substring(0, 100) + '...' });
    const response = await axios.post(
      `${META_GRAPH_API}/${adAccountId}/adimages`,
      {
        url: imageUrl,
      },
      {
        params: { access_token: accessToken },
      }
    );

    const images = response.data.images;
    const imageHash = Object.values(images)[0] as any;
    console.log('Image uploaded successfully, hash:', imageHash.hash);
    return imageHash.hash;
  } catch (error: any) {
    console.error('Upload ad image error:', error.response?.data || error.message);
    console.error('Full error:', JSON.stringify(error.response?.data, null, 2));

    // If sandbox mode and upload fails, suggest using test image hash
    if (isSandboxMode) {
      throw new Error(
        'Image upload failed in sandbox mode. Please set META_TEST_IMAGE_HASH in your .env file. ' +
        'You can get a test image hash by uploading an image to your sandbox ad account via Meta Ads Manager.'
      );
    }

    throw error;
  }
}

export async function getCampaignInsights(
  accessToken: string,
  campaignId: string
): Promise<any> {
  try {
    const response = await axios.get(`${META_GRAPH_API}/${campaignId}/insights`, {
      params: {
        access_token: accessToken,
        fields: 'impressions,clicks,spend,ctr,cpc,cpm',
      },
    });

    return response.data.data[0] || {};
  } catch (error) {
    console.error('Get campaign insights error:', error);
    throw error;
  }
}

export async function updateCampaignStatus(
  accessToken: string,
  campaignId: string,
  status: string
): Promise<void> {
  try {
    await axios.post(
      `${META_GRAPH_API}/${campaignId}`,
      { status },
      {
        params: { access_token: accessToken },
      }
    );
  } catch (error) {
    console.error('Update campaign status error:', error);
    throw error;
  }
}

export async function getAdInsights(
  accessToken: string,
  adId: string,
  datePreset?: string
): Promise<any> {
  try {
    const params: any = {
      access_token: accessToken,
      fields: 'impressions,clicks,spend,ctr,cpc,cpm,conversions,actions',
    };

    if (datePreset) {
      params.date_preset = datePreset;
    }

    const response = await axios.get(`${META_GRAPH_API}/${adId}/insights`, {
      params,
    });

    return response.data.data[0] || {};
  } catch (error) {
    console.error('Get ad insights error:', error);
    throw error;
  }
}
