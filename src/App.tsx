import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Plant,
  PlantCareLog,
  HouseholdMember,
  Household,
  GoogleUserProfile,
  ActiveTab,
  PlantDiagnosisRecord
} from './types';
import { INITIAL_PLANTS, INITIAL_CARE_LOGS, INITIAL_MEMBERS, DEFAULT_HOUSEHOLD } from './services/mockPlants';
import { plantSupabase, STORAGE_KEYS } from './services/supabase';
import { getPlantWateringStatus } from './utils/plantCalculations';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { MyPlantsTab } from './components/MyPlantsTab';
import { PlantDoctorTab } from './components/PlantDoctorTab';
import { ActivityHistoryTab } from './components/ActivityHistoryTab';
import { PlantDetailsModal } from './components/PlantDetailsModal';
import { AddPlantModal } from './components/AddPlantModal';
import { SettingsModal } from './components/SettingsModal';
import { HouseholdModal } from './components/HouseholdModal';

export function App() {
  const [currentHousehold, setCurrentHousehold] = useState<Household>(() =>
    plantSupabase.getActiveHousehold()
  );
  const [allHouseholds, setAllHouseholds] = useState<Household[]>(() =>
    plantSupabase.getCachedHouseholds()
  );
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(() =>
    plantSupabase.getSavedGoogleUser()
  );
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);

  const [plants, setPlants] = useState<Plant[]>(() => plantSupabase.getLocalPlants());
  const [logs, setLogs] = useState<PlantCareLog[]>(() => plantSupabase.getLocalLogs());
  const [members, setMembers] = useState<HouseholdMember[]>(() => plantSupabase.getLocalMembers());
  const [currentMember, setCurrentMember] = useState<HouseholdMember>(() => {
    const localMembers = plantSupabase.getLocalMembers();
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_MEMBER_ID);
    return localMembers.find((m) => m.id === savedId) || localMembers[0] || INITIAL_MEMBERS[0];
  });

  const [syncSource, setSyncSource] = useState<'remote' | 'local'>('local');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('plants_care_theme_dark');
    return saved ? saved === 'true' : false;
  });

  // Modals State
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [plantToEdit, setPlantToEdit] = useState<Plant | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [doctorPreselectedPlantId, setDoctorPreselectedPlantId] = useState<string | undefined>(
    undefined
  );

  // Toast Feedback Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Sync Dark Theme class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('plants_care_theme_dark', String(isDark));
  }, [isDark]);

  // Load & Sync Data from Supabase / LocalStorage
  const refreshData = useCallback(async (targetHouseholdId?: string) => {
    const hId = targetHouseholdId || currentHousehold.id;
    const data = await plantSupabase.loadAllData(hId);
    setPlants(data.plants);
    setLogs(data.logs);
    setMembers(data.members);
    setSyncSource(data.source);
    if (data.household) {
      setCurrentHousehold(data.household);
    }
  }, [currentHousehold.id]);

  // Check URL params for PWA shortcuts & household invite code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const tab = params.get('tab') as ActiveTab | null;
    const joinCode = params.get('join');

    if (action === 'add') {
      setIsAddModalOpen(true);
    }
    if (tab && ['dashboard', 'plants', 'doctor', 'history'].includes(tab)) {
      setActiveTab(tab);
    }

    if (joinCode) {
      (async () => {
        const res = await plantSupabase.joinHouseholdByCode(
          joinCode,
          googleUser?.name || 'שותף',
          googleUser
        );
        if (res.success && res.household) {
          setCurrentHousehold(res.household);
          setAllHouseholds(plantSupabase.getCachedHouseholds());
          await refreshData(res.household.id);
          showToast(`🎉 הצטרפת בהצלחה לקבוצה "${res.household.name}"!`);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          showToast(`⚠️ שגיאה בהצטרפות: ${res.message || 'קוד לא תקין'}`);
        }
      })();
    }
  }, [googleUser, refreshData]);

  // Google Auth listener & Household sync
  useEffect(() => {
    const unsubscribe = plantSupabase.onAuthStateChange(async (user) => {
      setGoogleUser(user);
      if (user) {
        showToast(`שלום ${user.name}! מחובר עם חשבון Google ✨`);
        const userHomes = await plantSupabase.loadUserHouseholds(user);
        if (userHomes.length > 0) {
          setAllHouseholds(userHomes);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    refreshData();
    const unsubscribe = plantSupabase.subscribeToRealtimeUpdates(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  // Select Active Household Member
  const handleSelectMember = (member: HouseholdMember) => {
    setCurrentMember(member);
    localStorage.setItem(STORAGE_KEYS.CURRENT_MEMBER_ID, member.id);
    showToast(`מחובר בתור: ${member.avatar} ${member.name}`);
  };

  // Household Switching & Creation
  const handleSwitchHousehold = async (h: Household) => {
    plantSupabase.setActiveHousehold(h);
    setCurrentHousehold(h);
    await refreshData(h.id);
    showToast(`עברת ל-${h.name} 🏡`);
  };

  const handleHouseholdCreatedOrJoined = async (h: Household) => {
    setAllHouseholds(plantSupabase.getCachedHouseholds());
    plantSupabase.setActiveHousehold(h);
    setCurrentHousehold(h);
    await refreshData(h.id);
    showToast(`קבוצה פעילה: ${h.name} ✨`);
  };

  // Water a Plant
  const handleWaterPlant = async (plant: Plant) => {
    const nowIso = new Date().toISOString();
    const updatedPlant: Plant = {
      ...plant,
      lastWateredAt: nowIso,
      lastWateredBy: currentMember.name,
      snoozedUntil: undefined
    };

    const newLog: PlantCareLog = {
      id: `log_${Date.now()}`,
      plantId: plant.id,
      plantName: plant.name,
      action: 'watered',
      performedBy: currentMember.name,
      timestamp: Date.now(),
      notes: `הושקה בכ-${plant.waterAmountMl} מ״ל מים`
    };

    setPlants((prev) => prev.map((p) => (p.id === plant.id ? updatedPlant : p)));
    setLogs((prev) => [newLog, ...prev]);
    if (selectedPlant?.id === plant.id) {
      setSelectedPlant(updatedPlant);
    }

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.75 }
      });
    } catch {}

    showToast(`💧 ${plant.name} הושקה בהצלחה ע״י ${currentMember.name}!`);
    await plantSupabase.upsertPlant(updatedPlant);
    await plantSupabase.addCareLog(newLog);
  };

  // Snooze Watering ("האדמה עדיין לחה - דחה ביומיים")
  const handleSnoozePlant = async (plant: Plant, days = 2) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const updatedPlant: Plant = {
      ...plant,
      snoozedUntil: target.toISOString()
    };

    const newLog: PlantCareLog = {
      id: `log_${Date.now()}`,
      plantId: plant.id,
      plantName: plant.name,
      action: 'snoozed',
      performedBy: currentMember.name,
      timestamp: Date.now(),
      notes: `האדמה עדיין לחה - ההשקיה נדחתה ב-${days} ימים`
    };

    setPlants((prev) => prev.map((p) => (p.id === plant.id ? updatedPlant : p)));
    setLogs((prev) => [newLog, ...prev]);
    if (selectedPlant?.id === plant.id) {
      setSelectedPlant(updatedPlant);
    }

    showToast(`⏳ ההשקיה של ${plant.name} נדחתה ב-${days} ימים (האדמה לחה)`);
    await plantSupabase.upsertPlant(updatedPlant);
    await plantSupabase.addCareLog(newLog);
  };

  // Mist a Plant
  const handleMistPlant = async (plant: Plant) => {
    const updatedPlant: Plant = {
      ...plant,
      lastMistedAt: new Date().toISOString()
    };

    const newLog: PlantCareLog = {
      id: `log_${Date.now()}`,
      plantId: plant.id,
      plantName: plant.name,
      action: 'misted',
      performedBy: currentMember.name,
      timestamp: Date.now(),
      notes: 'ריסוס לחות על העלים'
    };

    setPlants((prev) => prev.map((p) => (p.id === plant.id ? updatedPlant : p)));
    setLogs((prev) => [newLog, ...prev]);
    if (selectedPlant?.id === plant.id) {
      setSelectedPlant(updatedPlant);
    }

    showToast(`💦 ${plant.name} רוסס בלחות ע״י ${currentMember.name}!`);
    await plantSupabase.upsertPlant(updatedPlant);
    await plantSupabase.addCareLog(newLog);
  };

  // Fertilize a Plant
  const handleFertilizePlant = async (plant: Plant) => {
    const updatedPlant: Plant = {
      ...plant,
      lastFertilizedAt: new Date().toISOString()
    };

    const newLog: PlantCareLog = {
      id: `log_${Date.now()}`,
      plantId: plant.id,
      plantName: plant.name,
      action: 'fertilized',
      performedBy: currentMember.name,
      timestamp: Date.now(),
      notes: 'דישון תקופתי לקרקע'
    };

    setPlants((prev) => prev.map((p) => (p.id === plant.id ? updatedPlant : p)));
    setLogs((prev) => [newLog, ...prev]);
    if (selectedPlant?.id === plant.id) {
      setSelectedPlant(updatedPlant);
    }

    showToast(`🌱 ${plant.name} דושן בהצלחה!`);
    await plantSupabase.upsertPlant(updatedPlant);
    await plantSupabase.addCareLog(newLog);
  };

  // Save (Add or Edit) Plant
  const handleSavePlant = async (savedPlant: Plant) => {
    const isExisting = plants.some((p) => p.id === savedPlant.id);
    setPlants((prev) =>
      isExisting ? prev.map((p) => (p.id === savedPlant.id ? savedPlant : p)) : [savedPlant, ...prev]
    );

    if (!isExisting) {
      const addLog: PlantCareLog = {
        id: `log_${Date.now()}`,
        plantId: savedPlant.id,
        plantName: savedPlant.name,
        action: 'added',
        performedBy: currentMember.name,
        timestamp: Date.now(),
        notes: `נוסף לגינה הביתית (${savedPlant.species})`
      };
      setLogs((prev) => [addLog, ...prev]);
      await plantSupabase.addCareLog(addLog);
    }

    showToast(isExisting ? `🌿 ${savedPlant.name} עודכן!` : `🌿 ${savedPlant.name} נוסף לגינה הביתית!`);
    await plantSupabase.upsertPlant(savedPlant);
  };

  // Update Plant Directly (from Details Modal)
  const handleUpdatePlant = async (updatedPlant: Plant) => {
    setPlants((prev) => prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p)));
    if (selectedPlant?.id === updatedPlant.id) {
      setSelectedPlant(updatedPlant);
    }
    await plantSupabase.upsertPlant(updatedPlant);
  };

  // Delete Plant
  const handleDeletePlant = async (plantId: string) => {
    const target = plants.find((p) => p.id === plantId);
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
    if (selectedPlant?.id === plantId) {
      setSelectedPlant(null);
    }
    showToast(`הצמח ${target?.name || ''} הוסר מהגינה`);
    await plantSupabase.deletePlant(plantId);
  };

  // Apply AI Doctor Diagnosis to Plant
  const handleApplyDiagnosisToPlant = async (plantId: string, diagnosis: PlantDiagnosisRecord) => {
    const target = plants.find((p) => p.id === plantId);
    if (!target) return;

    const updatedPlant: Plant = {
      ...target,
      healthStatus: diagnosis.healthStatus,
      healthScore: diagnosis.healthScore,
      currentIssues: diagnosis.detectedIssues,
      wateringFrequencyDays: diagnosis.suggestedWateringDays || target.wateringFrequencyDays,
      soilType: diagnosis.suggestedSoilType || target.soilType,
      sunlight: diagnosis.suggestedSunlight || target.sunlight,
      careRecommendations: [
        ...diagnosis.treatmentSteps,
        ...(target.careRecommendations || [])
      ].slice(0, 6),
      diagnosisHistory: [diagnosis, ...(target.diagnosisHistory || [])]
    };

    const diagLog: PlantCareLog = {
      id: `log_${Date.now()}`,
      plantId: target.id,
      plantName: target.name,
      action: 'diagnosed',
      performedBy: currentMember.name,
      timestamp: Date.now(),
      notes: `אבחון AI: מדד בריאות ${diagnosis.healthScore}%`
    };

    setPlants((prev) => prev.map((p) => (p.id === plantId ? updatedPlant : p)));
    setLogs((prev) => [diagLog, ...prev]);
    showToast(`🩺 המלצות רופא ה-AI הוחלו על ${target.name}!`);

    await plantSupabase.upsertPlant(updatedPlant);
    await plantSupabase.addCareLog(diagLog);
  };

  // Computed Badges
  const thirstyCount = plants.filter((p) => {
    const st = getPlantWateringStatus(p);
    return st.urgency === 'overdue' || st.urgency === 'due_today';
  }).length;

  const attentionCount = plants.filter(
    (p) => p.healthStatus === 'needs_attention' || p.healthStatus === 'critical'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-void-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <Navbar
        members={members}
        currentMember={currentMember}
        onSelectMember={handleSelectMember}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddPlant={() => {
          setPlantToEdit(null);
          setIsAddModalOpen(true);
        }}
        syncSource={syncSource}
        thirstyCount={thirstyCount}
        currentHousehold={currentHousehold}
        onOpenHouseholdModal={() => setIsHouseholdModalOpen(true)}
        googleUser={googleUser}
        onGoogleUserChange={(user) => setGoogleUser(user)}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="bg-slate-900/95 dark:bg-emerald-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4">
        {activeTab === 'dashboard' && (
          <DashboardTab
            plants={plants}
            currentMember={currentMember}
            onWaterPlant={handleWaterPlant}
            onSnoozePlant={handleSnoozePlant}
            onMistPlant={handleMistPlant}
            onFertilizePlant={handleFertilizePlant}
            onSelectPlant={(p) => setSelectedPlant(p)}
            onOpenAddPlant={() => {
              setPlantToEdit(null);
              setIsAddModalOpen(true);
            }}
            onOpenDoctorForPlant={(p) => {
              setDoctorPreselectedPlantId(p.id);
              setActiveTab('doctor');
            }}
          />
        )}

        {activeTab === 'plants' && (
          <MyPlantsTab
            plants={plants}
            onSelectPlant={(p) => setSelectedPlant(p)}
            onWaterPlant={handleWaterPlant}
            onOpenAddPlant={() => {
              setPlantToEdit(null);
              setIsAddModalOpen(true);
            }}
            onOpenDoctorForPlant={(p) => {
              setDoctorPreselectedPlantId(p.id);
              setActiveTab('doctor');
            }}
          />
        )}

        {activeTab === 'doctor' && (
          <PlantDoctorTab
            plants={plants}
            currentMemberName={currentMember.name}
            onApplyDiagnosisToPlant={handleApplyDiagnosisToPlant}
            initialSelectedPlantId={doctorPreselectedPlantId}
          />
        )}

        {activeTab === 'history' && <ActivityHistoryTab logs={logs} members={members} />}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        onOpenAddPlant={() => {
          setPlantToEdit(null);
          setIsAddModalOpen(true);
        }}
        thirstyCount={thirstyCount}
        attentionCount={attentionCount}
      />

      {/* Plant Details Modal */}
      <PlantDetailsModal
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
        onWaterPlant={handleWaterPlant}
        onSnoozePlant={handleSnoozePlant}
        onMistPlant={handleMistPlant}
        onFertilizePlant={handleFertilizePlant}
        onEditPlant={(p) => {
          setPlantToEdit(p);
          setIsAddModalOpen(true);
        }}
        onDeletePlant={handleDeletePlant}
        onOpenDoctorForPlant={(p) => {
          setDoctorPreselectedPlantId(p.id);
          setActiveTab('doctor');
        }}
        onUpdatePlant={handleUpdatePlant}
      />

      {/* Add / Edit Plant Modal */}
      {isAddModalOpen && (
        <AddPlantModal
          onClose={() => {
            setIsAddModalOpen(false);
            setPlantToEdit(null);
          }}
          onSavePlant={handleSavePlant}
          currentMemberName={currentMember.name}
          plantToEdit={plantToEdit}
        />
      )}

      {/* Settings & Multi-device Sync Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          members={members}
          onSaveMembers={(updated) => {
            setMembers(updated);
            plantSupabase.saveMembers(updated);
          }}
          currentMember={currentMember}
          onSelectCurrentMember={handleSelectMember}
          allPlants={plants}
          allLogs={logs}
          onImportBackup={(data) => {
            setPlants(data.plants);
            setLogs(data.logs);
            setMembers(data.members);
            localStorage.setItem(STORAGE_KEYS.PLANTS_CACHE, JSON.stringify(data.plants));
            localStorage.setItem(STORAGE_KEYS.LOGS_CACHE, JSON.stringify(data.logs));
            localStorage.setItem(STORAGE_KEYS.MEMBERS_CACHE, JSON.stringify(data.members));
          }}
        />
      )}

      {/* Household & Roommates Management Modal */}
      {isHouseholdModalOpen && (
        <HouseholdModal
          onClose={() => setIsHouseholdModalOpen(false)}
          currentHousehold={currentHousehold}
          allHouseholds={allHouseholds}
          members={members}
          googleUser={googleUser}
          onSwitchHousehold={handleSwitchHousehold}
          onHouseholdCreatedOrJoined={handleHouseholdCreatedOrJoined}
        />
      )}
    </div>
  );
}

export default App;
