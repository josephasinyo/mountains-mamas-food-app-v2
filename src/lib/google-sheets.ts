// @ts-ignore
import Papa from 'papaparse';
import { FoodItem, CartItem } from './types';
import { getDriveDirectLink } from './utils';

const SHEET_ID = '1NxKZPOA01RicyZPo-MikhzjMpkN8BfdjC-K4bs35fLc';
const SHEET_NAME = 'Food List';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

export async function getFoodList(): Promise<any[]> {
    try {
        const response = await fetch(CSV_URL, { cache: 'no-store' }); // Ensure fresh data
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: false,
                skipEmptyLines: true,
                complete: (results: any) => {
                    const items = results.data.map((row: any): any => {
                        // Indices: 1: Name, 2: Type, 3: Link, 4: ID
                        let name = row[1] || '';
                        let type = row[2] || '';
                        const link = row[3] || '';
                        const id = row[4] || '';

                        let description = row[5] || '';
                        const priceRaw = row[6] || '';
                        const price = priceRaw ? parseFloat(priceRaw.toString().replace(/[^0-9.]/g, '')) : 0;
                        const tourCompanyRaw = row[7] || '';
                        const boxIncludesRaw = row[8] || '';

                        if (!name || name.toLowerCase().includes('search') || name.toLowerCase().trim() === 'name') return null;

                        const cleanLink = link.replace(/^Link\s+/i, '').trim();
                        const cleanId = id.replace(/^ID\s+/i, '').trim();

                        return {
                            id: cleanId || Math.random().toString(36).substr(2, 9),
                            name: name.replace(/^Name\s+/i, '').trim(),
                            type: type.replace(/^Type\s+/i, '').trim(),
                            imageLink: cleanLink || '',
                            directImageUrl: getDriveDirectLink(cleanLink),
                            price: price || 0,
                            description: description.replace(/^Description\s+/i, '').trim(),
                            tourCompany: tourCompanyRaw.trim(),
                            boxIncludes: boxIncludesRaw.trim(),
                        };
                    }).filter((item: any): item is any => item !== null);

                    resolve(items);
                },
                error: (error: any) => {
                    reject(error);
                },
            });
        });
    } catch (error) {
        console.error('Error fetching food data:', error);
        return [];
    }
}

export async function getTourGroups(): Promise<string[]> {
    const SETTINGS_SHEET_NAME = 'Settings';
    const SETTINGS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SETTINGS_SHEET_NAME)}`;

    try {
        const response = await fetch(SETTINGS_CSV_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch settings');
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: false,
                skipEmptyLines: true,
                complete: (results: any) => {
                    // Range E3:E means column E (index 4) starting from row 3 (index 2)
                    const data = results.data;
                    const groups: string[] = [];
                    for (let i = 2; i < data.length; i++) {
                        const row = data[i];
                        if (row && row[4] && row[4].toString().trim()) {
                            groups.push(row[4].toString().trim());
                        }
                    }
                    resolve(groups);
                },
                error: (error: any) => reject(error),
            });
        });
    } catch (error) {
        console.error('Error fetching tour groups:', error);
        return [];
    }
}

export async function submitOrder(cart: CartItem[], tourDetails: any, notes?: string): Promise<boolean> {
    try {
        // 1. Define the specific order of meals mapped to their exact sheet columns (F → W).
        //    Empty strings ('') are placeholders for unused columns so every value
        //    lands in the correct column. "Additional notes" (col V) is sent via
        //    the separate `notes` field in the payload — not through this array.
        const MEAL_ORDER = [
            'The Vegetarian',                                // col F
            'The Madison',                                   // col G
            'The Yellowstone Club',                          // col H
            'The BLT',                                       // col I
            'The Grizzly Bear',                              // col J
            'Ham and Cheese',                                // col K
            'Peanut Butter and Huckleberry Jam',             // col L
            'Turkey and Cheese',                             // col M
            'Garden Salad',                                  // col N
            '',                                              // col O – empty
            'Grilled Chicken Salad',                         // col P
            '',                                              // col Q – empty
            '',                                              // col R – empty
            '',                                              // col S – empty
            '',                                              // col T – empty
            '',                                              // col U – empty
            '',                                              // col V – Additional notes (sent via `notes` field)
            'Roastbeef and Cheese',                          // col W
            '',                                              // col X
            'Chicken Salad Sandwich',                        // col Y
            'Tuna Salad Sandwich',                           // col Z
            'Caprice Sandwich',                              // col AA
        ];

        // 2. Map cart items to these specific columns
        const mealColumns = MEAL_ORDER.map(mealName => {
            // Find items in cart that match this meal name
            // We use a flexible match because cart item names might include " - Box Lunch" or " - Junior Box Lunch"
            const itemsInCart = cart.filter(item => {
                const baseItemName = item.name.replace(/\s*-\s*(Box Lunch|Junior Box Lunch|Box Lunch|Junior Box Lunch)$/i, '').trim();
                return baseItemName.toLowerCase() === mealName.toLowerCase();
            });

            if (itemsInCart.length === 0) return '';

            return itemsInCart
                .map(item => {
                    const pickUpLabel = tourDetails.isStandard ? 'Pick location' : 'Time of pick-up';
                    return `Quantity: ${item.quantity}\n${item.selectedOption || 'Standard'}\n${pickUpLabel}: ${tourDetails.pickUpTime}`;
                })
                .join('\n_________\n');
        });

        // 3. Construct the payload for the Google Apps Script
        const payload = {
            sheetName: 'App Orders',
            tourGroup: tourDetails.tourGroup,
            tourGroupName: tourDetails.isYellowstone ? tourDetails.guideName : (tourDetails.tourGroupName || ''),
            fullName: tourDetails.fullName,
            guideName: tourDetails.guideName,
            tourDate: tourDetails.tourDate,
            pickUpTime: tourDetails.pickUpTime,
            meals: mealColumns, // This will be mapped to columns F, G, H...
            notes: notes || ''
        };

        // TODO: The user needs to deploy a Google Apps Script as a Web App and paste the URL here
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyP6DemV6IS8_IR4Eq7bQ3bz5ObKEtvI_ak8aMTxzQJuh1l52K8V9j9yixfVCloRMp9/exec'; // Placeholder

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Use no-cors for Google Apps Script to avoid preflight issues
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // With no-cors, we can't read the response body, but if it doesn't throw, it's usually sent
        return true;
    } catch (error) {
        console.error('Error submitting order to sheet:', error);
        return false;
    }
}
