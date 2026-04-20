// Video Migration Script
// This script processes the CSV and calls the migrate-video-links edge function

const CSV_DATA = `1CqesMB87vV32jx4pBkEqz2fEUDm5QMsB,https://youtu.be/GAwJWKSRSlU
1vCm0cGBxpFd1Lf7LaDxzWJKc-kT7MH77,https://youtu.be/tpJhCO1p6Kw
1W1bDh1t3x7kUrcBxb7e6nwwAXC0hD8WQ,https://youtu.be/FV3bnUfiK9g
14MKfHBsH3i7FZHvaBphKBPf98vPRb-rF,https://youtu.be/i5j_h1zX6wA
1Q_9WExVCJ-HH0TnVpKVYQLZvmgKlIVan,https://youtu.be/M7TP9qZTg4I
13U-3kZRjCOVq3W1cI6YGHqo3I9M-vNQn,https://youtu.be/dqOW6T1AZKE
1l4vxI3uIlG7vdT7cpEy_DQpG7TckG73C,https://youtu.be/Q3_ggp0CZLI
17qB4B_K4evK8d8Iyh-B3dqHmYTj51yX2,https://youtu.be/FbL89THUBEo
1IcT9Ee-XHMkYMGwPcVLTzRyuDWKNnVm2,https://youtu.be/1zDXEldhYSE
1esCq62YxHB5kKaLsITYTIDQPZw5CX52o,https://youtu.be/upwQpgXKZEs
1eK0H7GG0uE-8o2wEYHh76fOpUYwB4Gsd,https://youtu.be/g-sYZ9f_WaA
1zIFTI_oKSG5cDnR3BQFEwxRQbTMRF8VJ,https://youtu.be/jtD3YECaRd0
1T67aHg40Yz77qCj-drrPPfQbLwI22xPS,https://youtu.be/w9YbNVX-T50
1tqf46RGJwJ-wdQKdMK6QPZxMvJu10pTp,https://youtu.be/hUCYD1k-U4c
1oo55gnpDr_Y2BoK5HpRlv2zC3s3khXp0,https://youtu.be/pWatVvdSUzU
1aKBJbfQ0O_mNK3mWe6FCLk2Gfu78nUTu,https://youtu.be/9_LWQGJBfzU
1O-aDWYHsxn67W2RLhzHgOHfUV4w-cShc,https://youtu.be/t3zJOv-WPr8
1sOjzuGp7E1TdKu8z-Vt6qj6yQY3oW1T3,https://youtu.be/8pRlz3UO2Zo
1WfOk1CJ8L5OxQJXTRUK4G5jW0KxXjsOu,https://youtu.be/c7-MJi_wvV0
1laBR60FxZaSm2WOCIcfPsX0p6DbDhfMq,https://youtu.be/E8yDGEe4n4g
17aaIhg-oIRQxp6cKpK5VdNmrpN4EWmEP,https://youtu.be/jxKbsN8gZj0
1YLGM-RWLKRxAQmYPqjSN4wSF4bYCTG1r,https://youtu.be/SWOHmEbTzE4
1nOi0zp39W_CXR2n1gE6eC_Xz59B5A1g_,https://youtu.be/hcdI9j4o2Bo
1JMTy9YdWqZ7Qpt4Dq83mHKo_OGcuIJx4,https://youtu.be/-_s51R4M6OY
1LVzTWBhSA88BW7sAYNhOCqF2jtA22kED,https://youtu.be/tHk-a_WZD7k
1LL9lq6aWuDtXQC5-kB9vJ8ek1lWW8eC5,https://youtu.be/hD9RLJD4pXw
1KDWt7FqwKhNzVPsq6nCQXIcxRiJ8KD5T,https://youtu.be/u6Mn0DqZX0c
1h1GmzgHBLBZzXwqj9VrGTCt0nY3QEUbI,https://youtu.be/qiTyQAXLJhc
1nI1HMm1QcQaHr5Mz1tUU3EQBCu-qEsqi,https://youtu.be/Wkt0HqRYGXQ
1DuWCXwRJ89uEXIaWJq7Nv1bC-c9qdV96,https://youtu.be/rk_LObIojyQ
1lCeJN5GN8v_R9MeJ_-aVHJiQ8rZ_lK3f,https://youtu.be/U8G_KYm0h1I
17EgQ15sYGjLAP22g9_Uxsk_6mBBUd66z,https://youtu.be/J65FUr2DlP4
1LQy55hImz7jgO1yxmgWMwEMh5x8B_oU9,https://youtu.be/kqyYy3Y5dMc
1OB2E1q8RoXwdBlJHYy-YRyeDGZZFATFU,https://youtu.be/hx04ojYd9sA
1h_zEcAz-pUBz78RZy2eGUdTFCH3lVLKf,https://youtu.be/Y46MO-QJ5eY
1T9L1Hnfil5LkYD8BfHSgMakmJPGPc_Mv,https://youtu.be/6IiW8zXnkOc
1eKt1WuZ80z1y5Pu2YKpCwuOg78YqMgQ1,https://youtu.be/cHw3l3AYKCY
1Yoo0N0zcbECp67vkh4oJXLqNpHQCUyp1,https://youtu.be/51DLkMxJd2U
1HdywwMI5a6j_ijc5m4TCf8cLGPAW7Gmi,https://youtu.be/yA9ZrEWJ7oc
1zcF4-LzMGEaZTUKhT5D8fxEGZ1YwvYKM,https://youtu.be/NfWwlGhF4oc
1M98DBvQ0CkdJ8t2u1NVQh0YXFRWJl8Z7,https://youtu.be/LK0pN9E6xZM
1JLrWQ0I6WOLRBQgONDe0q2E9igXEDEaT,https://youtu.be/r88S9Fa-o54
1VXRtzDr7_aCTPPGO0_NVq_uSjvx6kzMy,https://youtu.be/LgbJIPsWRIU
1Pl3qJ3JOCrwI5KE9sU2WtJ7WwRIl94o7,https://youtu.be/tLXsGu62YUs
1vHn80YS0GApLsEgQyO9MJ0N4oPSw2oC6,https://youtu.be/vF0_Uf6Q6Dw
1eCqDw3nVqv73IYDS7Yn8mCdE7HKU8v8B,https://youtu.be/rkDsZbwwzR4
1L0j_Q-Wpt1IK77gLQh-xHl1YGYDw1Pby,https://youtu.be/lbMX8kjaNbY
1tKzDmBeBWMUdU1K64IWvlTB8KHk4w38U,https://youtu.be/DqO0fkIbxs0
1o4Jkm_MXwVS9Bce0jWPsyBSq1dTdPGP0,https://youtu.be/Ryz_SLO7VWo
1kHCm8hVQ8MdhYCZa6B1ZEZmJ96L_fVUZ,https://youtu.be/0h_3rCDWxEY
1k7EyIlW-7u2bBhZY_Z1Tf9OvUhTz1zR1,https://youtu.be/3-lGjI0xIX4
1f3n7mTUBFb4dw5a6FPWM0fA_g3u67Azl,https://youtu.be/KHbX_TfOCc8
1f0fNWV4vZpvQMNTRPvEwWiKuOUF7V3z3,https://youtu.be/qEPe9qLdAaA
1pJRJwsxZVP_yO1HFvUVoCOGj1v7N6FJt,https://youtu.be/MdOaXAh1H1I
1YvXB7T-01k1KBIa8UiRNtX3sLAv3cGHQ,https://youtu.be/MwQIIbJXa3E
1m6MJD4qGIBmN1RjC7ZVMaGdgA2ufDMAe,https://youtu.be/UNUOVb3sN0U
1OARm8WG2YY0DqcPD8rFnGglXr83RL3ZD,https://youtu.be/NmgcNSHAP0A
1vRLGPzXDKZvfzzJK9Hb6qHFo62MG5z-8,https://youtu.be/MoCZtgCOF4U
1LFa5CKnlpNP7Lz1zl82WPrcRvl21Xaz8,https://youtu.be/x58Vs4EwYZs
1U5WoGDc_OxuNCdI1pSFRDBNaBRiRW5xH,https://youtu.be/N0gp5Y_WCT0
1Uu3z1zaPv9HRc3R1E3xgfHqtm0kBZ0e6,https://youtu.be/AWaBOy8f0n8
1OTM2xq-YvRx2s2BsIp0evW4P0e4oqjwf,https://youtu.be/VPr3z7x8h0U
1h5n0fzS1oiE83eSoGiWPZ2QaVuVbbGd5,https://youtu.be/P5wxjrxIKJE
1qaPQWCZRJPkZZbIVa66GCrBPTHHI9w6s,https://youtu.be/v9YdK_RsI6w
1TZUyAj4_hxsGrvDWu_HiSpznGgLN9xRv,https://youtu.be/T_hE6a83tSY
10Kk9RrZnrq_q0JUWo-ssgmj-4DHPrF5a,https://youtu.be/5Wot8b6hOcw
1kn8D2kcVmTa5Lb2nAnLXMtpRWabdq-oj,https://youtu.be/wEvXI9OYuxQ
1lLrcVRt_eWgHqtRz1SjnqQiugaQrCsE9,https://youtu.be/TXCNd37MWoM
1MaC4SQ_ZUnCcT6_9E9ZTQK4-BF38M9tZ,https://youtu.be/QZMCbhIwfTU
1C5gzKS1_4jlKxnwlg2dVlujpD2Qj5LBK,https://youtu.be/rNJOJ6RlmCQ
1Sl8R4fPJ-6NVxTt92oYJUdSU3bvmBVX9,https://youtu.be/vBME-g6HwMk
1CUe4-PqFNkrqf6xqOBLCHGS1HEWLvC4t,https://youtu.be/XPZf8SIpI5E
1bYHZx21NQQcmL1AzkdJF00tqYhQZJEDj,https://youtu.be/B9xA--sTaQk
1tjS0JuZYS2DGg89rGqf0LyE0i2v7aRCc,https://youtu.be/Fxn9hG9aXXk
19pzO2_UgZdowdxAf2kDWnZDJ7BfImgBl,https://youtu.be/VPkYQYH4mVs
1YaZJHOgqhm8VkQC2S6F9fZjJjNhAF1b7,https://youtu.be/hg95JGCQp0c
1gIkHwNvJTtF0Eoy7EYzCq2GzOu_M9GQT,https://youtu.be/wR1SvNxJy08
13DeLv9GQtbqG24I_tMW5qN2gk-Ie-W56,https://youtu.be/bjTUTJ4fN-U
1D6_KJT2TpBmZnLPfwqEpP-2Sp5OPRjFv,https://youtu.be/Q_VLkKxMF20
1qhKmMZIqU4LSmrb6qZAP7vbEQrk3U__r,https://youtu.be/5-EFGvHmC94
1cWlPg-HQP0MqTXhWbCYYVpKy3Yo3Xr7g,https://youtu.be/zsjE4VQm0Og
1fNyZGDh_lG0j-fH2soCCXuGF93w6J7vB,https://youtu.be/n_f3VDNgQLE
1R4SBuALlMjEHcU6Pxbu5VnFpVoQVIo6j,https://youtu.be/T3LI8_v4x7A
1gFGiPCOjbBWpw_6TVHHthMmMDHPG96qm,https://youtu.be/ZYVqRXTNWAI
1Y68L8_yZR2Zy1qCjz5nOvPU9m-lhO8sH,https://youtu.be/0qsLKM-XA_Q
1yUuN6V6sI_KQP7q4L-_wEGH-YcQlRj-V,https://youtu.be/WkIDxbDtCNA`;

interface VideoMapping {
  driveId: string;
  youtubeUrl: string;
}

function parseCSV(csvData: string): VideoMapping[] {
  const lines = csvData.trim().split("\n");
  return lines.map((line) => {
    const [driveId, youtubeUrl] = line.split(",");
    return { driveId: driveId.trim(), youtubeUrl: youtubeUrl.trim() };
  });
}

async function runMigration() {
  const mappings = parseCSV(CSV_DATA);

  console.log(`Parsed ${mappings.length} video mappings from CSV`);
  console.log("First mapping example:", mappings[0]);

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mjemehqhirspbcetibki.supabase.co";
  const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/migrate-video-links`;
  const ADMIN_API_KEY = "YOUR_ADMIN_API_KEY"; // Replace with actual key

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        //'Authorization': `Bearer ${ADMIN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mappings }),
    });

    const result = await response.json();

    console.log("\n=== MIGRATION RESULTS ===");
    console.log(`Total mappings: ${result.totalMappings}`);
    console.log(`Successful updates: ${result.successfulUpdates}`);
    console.log(`Failed updates: ${result.failedUpdates}`);
    console.log(`Not found Drive IDs: ${result.notFoundDriveIds.length}`);

    if (result.notFoundDriveIds.length > 0) {
      console.log("\nDrive IDs not found in database:");
      result.notFoundDriveIds.forEach((id: string) => console.log(`  - ${id}`));
    }

    if (result.errors.length > 0) {
      console.log("\nErrors:");
      result.errors.forEach((error: string) => console.log(`  - ${error}`));
    }

    console.log("\n=== UPDATED SECTIONS ===");
    result.updatedSections.forEach((section: any) => {
      console.log(`Section ${section.id}:`);
      console.log(`  Drive ID: ${section.driveId}`);
      console.log(`  Old: ${section.oldUrl}`);
      console.log(`  New: ${section.newUrl}`);
    });
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Uncomment to run:
runMigration();

export { parseCSV, runMigration };
