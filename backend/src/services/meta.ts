import axios from 'axios';

const META_API_VERSION = 'v18.0';
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
      },
      {
        params: { access_token: accessToken },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Create campaign error:', error);
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
    const response = await axios.post(
      `${META_GRAPH_API}/${adAccountId}/adsets`,
      {
        name,
        campaign_id: campaignId,
        daily_budget: dailyBudget * 100, // Convert to cents
        billing_event: 'IMPRESSIONS',
        optimization_goal: optimizationGoal,
        bid_amount: 200,
        targeting,
        status: 'PAUSED',
      },
      {
        params: { access_token: accessToken },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Create ad set error:', error);
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
  name: string;
  headline: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  callToAction: string;
}

export async function createAdCreative(params: CreateAdCreativeParams): Promise<string> {
  const { accessToken, adAccountId, name, headline, body, imageUrl, linkUrl, callToAction } = params;

  try {
    // First, upload the image
    const imageHash = await uploadAdImage(accessToken, adAccountId, imageUrl);

    // Create the ad creative
    const response = await axios.post(
      `${META_GRAPH_API}/${adAccountId}/adcreatives`,
      {
        name,
        object_story_spec: {
          page_id: adAccountId.replace('act_', ''), // Simplified - should get actual page ID
          link_data: {
            image_hash: imageHash,
            link: linkUrl,
            message: body,
            name: headline,
            call_to_action: {
              type: callToAction.toUpperCase().replace(' ', '_'),
            },
          },
        },
      },
      {
        params: { access_token: accessToken },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Create ad creative error:', error);
    throw error;
  }
}

async function uploadAdImage(
  accessToken: string,
  adAccountId: string,
  imageUrl: string
): Promise<string> {
  try {
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
    return imageHash.hash;
  } catch (error) {
    console.error('Upload ad image error:', error);
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
