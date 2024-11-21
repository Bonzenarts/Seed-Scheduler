import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Download, Upload, FileText } from 'lucide-react';
import Papa from 'papaparse';
import type { Crop, CropVariety } from '../types';
import { cropGroups } from '../data/cropGroups';

export default function CropDataManager() {
  const { defaultCrops, updateDefaultCrops } = useInventory();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateTypeScriptContent = (crops: Crop[]): string => {
    const formatArray = (arr: string[]): string => {
      if (arr.length === 0) return '[]';
      return `[${arr.map(item => `'${item}'`).join(', ')}]`;
    };

    const formatVariety = (variety: CropVariety): string => {
      return `      {
        id: '${variety.id}',
        name: '${variety.name}',
        daysToGermination: ${variety.daysToGermination},
        daysToTransplant: ${variety.daysToTransplant},
        daysToHarvest: ${variety.daysToHarvest},
        startMonth: ${variety.startMonth},
        endMonth: ${variety.endMonth},
        method: '${variety.method}',
        sowingType: '${variety.sowingType}',
        overwinter: ${variety.overwinter},
        transplantingSize: { width: ${variety.transplantingSize.width}, height: ${variety.transplantingSize.height} },
        harvestingSize: { width: ${variety.harvestingSize.width}, height: ${variety.harvestingSize.height} },
        frostSensitivity: '${variety.frostSensitivity}',
        companionPlants: ${formatArray(variety.companionPlants)},
        incompatiblePlants: ${formatArray(variety.incompatiblePlants)},
        spacing: { row: ${variety.spacing.row}, column: ${variety.spacing.column} },
        frostWarning: {
          spring: { startMonth: ${variety.frostWarning.spring.startMonth}, endMonth: ${variety.frostWarning.spring.endMonth} },
          fall: { startMonth: ${variety.frostWarning.fall.startMonth}, endMonth: ${variety.frostWarning.fall.endMonth} }
        }
      }`;
    };

    const formatCrop = (crop: Crop): string => {
      return `  {
    id: '${crop.id}',
    name: '${crop.name}',
    groupId: '${crop.groupId}',
    varieties: [
${crop.varieties.map(v => formatVariety(v)).join(',\n')}
    ]
  }`;
    };

    return `import { Crop } from '../types';

// Define the default crops array
const defaultCrops: Crop[] = [
${crops.map(formatCrop).join(',\n')}
];

// Export both as named exports and default export
export { defaultCrops };
export default defaultCrops;`;
  };

  const handleExportCSV = () => {
    try {
      const csvData: any[] = [];

      defaultCrops.forEach(crop => {
        crop.varieties.forEach(variety => {
          csvData.push({
            'Crop ID': crop.id,
            'Crop Name': crop.name,
            'Group ID': crop.groupId,
            'Variety ID': variety.id,
            'Variety Name': variety.name,
            'Days to Germination': variety.daysToGermination,
            'Days to Transplant': variety.daysToTransplant,
            'Days to Harvest': variety.daysToHarvest,
            'Start Month': variety.startMonth,
            'End Month': variety.endMonth,
            'Method': variety.method,
            'Sowing Type': variety.sowingType,
            'Overwinter': variety.overwinter,
            'Transplanting Size Width': variety.transplantingSize.width,
            'Transplanting Size Height': variety.transplantingSize.height,
            'Harvesting Size Width': variety.harvestingSize.width,
            'Harvesting Size Height': variety.harvestingSize.height,
            'Frost Sensitivity': variety.frostSensitivity,
            'Companion Plants': variety.companionPlants.join(';'),
            'Incompatible Plants': variety.incompatiblePlants.join(';'),
            'Spacing Row': variety.spacing.row,
            'Spacing Column': variety.spacing.column,
            'Frost Warning Spring Start Month': variety.frostWarning.spring.startMonth,
            'Frost Warning Spring End Month': variety.frostWarning.spring.endMonth,
            'Frost Warning Fall Start Month': variety.frostWarning.fall.startMonth,
            'Frost Warning Fall End Month': variety.frostWarning.fall.endMonth
          });
        });
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'garden-crops.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('CSV exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export CSV');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportTypeScript = () => {
    try {
      const tsContent = generateTypeScriptContent(defaultCrops);
      const blob = new Blob([tsContent], { type: 'text/typescript;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'defaultCrops.ts');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('TypeScript file exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export TypeScript file');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const cropsMap = new Map<string, Crop>();

          results.data.forEach((row: any) => {
            if (!row['Crop ID'] || !row['Crop Name'] || !row['Group ID']) return;

            const cropId = row['Crop ID'];
            if (!cropsMap.has(cropId)) {
              cropsMap.set(cropId, {
                id: cropId,
                name: row['Crop Name'],
                groupId: row['Group ID'],
                varieties: []
              });
            }

            const crop = cropsMap.get(cropId)!;
            if (row['Variety ID'] && row['Variety Name']) {
              crop.varieties.push({
                id: row['Variety ID'],
                name: row['Variety Name'],
                daysToGermination: parseInt(row['Days to Germination']) || 0,
                daysToTransplant: parseInt(row['Days to Transplant']) || 0,
                daysToHarvest: parseInt(row['Days to Harvest']) || 0,
                startMonth: parseInt(row['Start Month']) || 1,
                endMonth: parseInt(row['End Month']) || 12,
                method: row['Method'] || '',
                sowingType: row['Sowing Type'] || 'Indoor/Outdoor',
                overwinter: row['Overwinter']?.toLowerCase() === 'true',
                transplantingSize: {
                  width: parseInt(row['Transplanting Size Width']) || 0,
                  height: parseInt(row['Transplanting Size Height']) || 0
                },
                harvestingSize: {
                  width: parseInt(row['Harvesting Size Width']) || 0,
                  height: parseInt(row['Harvesting Size Height']) || 0
                },
                frostSensitivity: row['Frost Sensitivity'] || 'low',
                companionPlants: row['Companion Plants']?.split(';').filter(Boolean) || [],
                incompatiblePlants: row['Incompatible Plants']?.split(';').filter(Boolean) || [],
                spacing: {
                  row: parseInt(row['Spacing Row']) || 0,
                  column: parseInt(row['Spacing Column']) || 0
                },
                frostWarning: {
                  spring: {
                    startMonth: parseInt(row['Frost Warning Spring Start Month']) || 3,
                    endMonth: parseInt(row['Frost Warning Spring End Month']) || 5
                  },
                  fall: {
                    startMonth: parseInt(row['Frost Warning Fall Start Month']) || 9,
                    endMonth: parseInt(row['Frost Warning Fall End Month']) || 10
                  }
                }
              });
            }
          });

          const newCrops = Array.from(cropsMap.values());
          updateDefaultCrops(newCrops);
          setSuccess('CSV imported successfully');
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError('Failed to process CSV data');
          setTimeout(() => setError(null), 3000);
        }
      },
      error: () => {
        setError('Failed to read CSV file');
        setTimeout(() => setError(null), 3000);
      }
    });

    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Upload className="h-5 w-5" />
            Import CSV
          </label>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </button>
        <button
          onClick={handleExportTypeScript}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <FileText className="h-5 w-5" />
          Export TypeScript
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}
    </div>
  );
}