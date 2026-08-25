export const MAP_PERIODS = ["1200-1450", "1450-1750", "1750-1900", "1900-2001"] as const;

export type MapPeriod = typeof MAP_PERIODS[number];
export type MapCategory = "Easy" | "Hard" | "Geography";
export type MapRegion = "Africa" | "Central America" | "East Asia" | "Europe" | "Middle East" | "North America" | "Russia" | "South America" | "South Asia" | "Southeast Asia";

export interface MapTerm {
  id: string;
  period: MapPeriod;
  category: MapCategory;
  name: string;
  region: MapRegion;
}

const rawTerms = String.raw`
1200-1450|Easy|Song Dynasty|East Asia
1200-1450|Hard|Mahayana|South Asia
1200-1450|Geography|Tenochtitlan|Central America
1200-1450|Easy|Confucianism|East Asia
1200-1450|Hard|Theravada Buddhism|South Asia
1200-1450|Geography|Mississippi River|North America
1200-1450|Easy|Birth of Buddhism|South Asia
1200-1450|Hard|The Vedas|South Asia
1200-1450|Geography|Andes|South America
1200-1450|Easy|Filial Piety|East Asia
1200-1450|Hard|Heian|East Asia
1200-1450|Geography|Lake Titicaca|South America
1200-1450|Easy|Grand Canal|East Asia
1200-1450|Hard|Bhakti Movement|South Asia
1200-1450|Geography|Patagonia|South America
1200-1450|Easy|Porcelain|East Asia
1200-1450|Hard|Khmer Empire|Southeast Asia
1200-1450|Geography|Cuzco|South America
1200-1450|Easy|Champa Rice|Southeast Asia
1200-1450|Hard|Cahokia|North America
1200-1450|Geography|Venice|Europe
1200-1450|Easy|Mamluk Sultanate|Africa
1200-1450|Hard|Hausa Kingdom|Africa
1200-1450|Geography|Danube River|Europe
1200-1450|Easy|Delhi Sultanate|South Asia
1200-1450|Hard|Gujarat|South Asia
1200-1450|Geography|Euphrates River|Middle East
1200-1450|Easy|Abbasid Caliphate|Middle East
1200-1450|Hard|Malay Communities|Southeast Asia
1200-1450|Geography|Mecca|Middle East
1200-1450|Easy|House of Wisdom|Middle East
1200-1450|Hard|Borobudur|Southeast Asia
1200-1450|Geography|Medina|Middle East
1200-1450|Easy|Al-Andalus|Europe
1200-1450|Hard|Quechua|South America
1200-1450|Geography|Baghdad|Middle East
1200-1450|Easy|Vijayanagara Empire|South Asia
1200-1450|Hard|Algonquin|North America
1200-1450|Geography|Congo River|Africa
1200-1450|Easy|Inca Empire|South America
1200-1450|Geography|Niger River|Africa
1200-1450|Easy|Mayan Empire|Central America
1200-1450|Geography|Kilimanjaro|Africa
1200-1450|Easy|Great Zimbabwe|Africa
1200-1450|Geography|Cape of Good Hope|Africa
1200-1450|Easy|Ethiopia|Africa
1200-1450|Geography|Indus River|South Asia
1200-1450|Easy|Hinduism|South Asia
1200-1450|Geography|Bengal|South Asia
1200-1450|Easy|Compass|East Asia
1200-1450|Geography|Calicut|South Asia
1200-1450|Easy|Gunpowder|East Asia
1200-1450|Geography|Delhi|South Asia
1200-1450|Easy|Genghis Khan|East Asia
1200-1450|Geography|Ganges River|South Asia
1200-1450|Easy|Kublai Khan|East Asia
1200-1450|Geography|Java|Southeast Asia
1200-1450|Easy|Muslim Translation Movement|Middle East
1200-1450|Geography|Sumatra|Southeast Asia
1200-1450|Easy|Malacca|Southeast Asia
1200-1450|Geography|Mekong River|Southeast Asia
1200-1450|Easy|Swahili Coast|Africa
1200-1450|Geography|Yellow River|East Asia
1200-1450|Easy|Zheng He|East Asia
1200-1450|Geography|Beijing|East Asia
1200-1450|Easy|Ming Dynasty|East Asia
1200-1450|Geography|Nanjing|East Asia
1200-1450|Easy|Mali|Africa
1200-1450|Geography|Kyoto|East Asia
1200-1450|Easy|Mansa Musa|Africa
1200-1450|Geography|Korea|East Asia
1200-1450|Easy|Ibn Battuta|Africa
1200-1450|Geography|Siberia|Russia
1200-1450|Easy|Margery Kempe|Europe
1200-1450|Geography|Volga River|Russia
1200-1450|Easy|Marco Polo|Europe
1200-1450|Geography|Yucatan Peninsula|Central America
1200-1450|Easy|Angkor Wat|Southeast Asia
1200-1450|Geography|Tierra del Fuego|South America
1200-1450|Easy|Chitchen Itza|Central America
1200-1450|Geography|Damascus|Middle East
1200-1450|Easy|Timbuktu|Africa
1200-1450|Geography|Strait of Hormuz|Middle East
1200-1450|Easy|Machu Picchu|South America
1200-1450|Geography|Anatolia|Middle East
1200-1450|Easy|Tang Dynasty|East Asia
1200-1450|Geography|Persian Gulf|Middle East
1200-1450|Easy|Foot Binding|East Asia
1200-1450|Geography|Lake Victoria|Africa
1200-1450|Easy|Civil Service Exam|East Asia
1200-1450|Geography|Nile River|Africa
1200-1450|Easy|Samurai|East Asia
1200-1450|Geography|Sahara Desert|Africa
1200-1450|Easy|Shinto|East Asia
1200-1450|Geography|Great Rift Valley|Africa
1200-1450|Easy|Songhai Empire|Africa
1200-1450|Geography|Xi'an|East Asia
1200-1450|Easy|Kilwa|Africa
1200-1450|Geography|Manchuria|East Asia
1200-1450|Easy|Gold-Salt Trade|Africa
1200-1450|Geography|Forbidden City|East Asia
1200-1450|Easy|Magna Carta|Europe
1200-1450|Geography|Yangtze River|East Asia
1200-1450|Easy|Olmecs|Central America
1200-1450|Geography|Catalonia|Europe
1200-1450|Easy|Kievan Rus|Russia
1200-1450|Geography|Sri Lanka|South Asia
1200-1450|Easy|Paper Money|East Asia
1200-1450|Geography|Jerusalem|Middle East
1200-1450|Easy|Chinampas|Central America
1200-1450|Easy|Birth of Islam|Middle East
1200-1450|Easy|Maize|Central America
1200-1450|Easy|Daoism|East Asia
1200-1450|Easy|Han|East Asia
1450-1750|Easy|Ottoman Empire|Middle East
1450-1750|Hard|Pueblo Revolts|North America
1450-1750|Geography|Rome|Europe
1450-1750|Easy|Devshirme|Middle East
1450-1750|Hard|Metacom's War|North America
1450-1750|Geography|Morocco|Africa
1450-1750|Easy|Janissaries|Middle East
1450-1750|Hard|Cossack Revolts|Russia
1450-1750|Geography|Oman|Middle East
1450-1750|Easy|Samurai|East Asia
1450-1750|Hard|Maratha Confederacy|South Asia
1450-1750|Geography|Kashmir|South Asia
1450-1750|Easy|Tokugawa Shogunate|East Asia
1450-1750|Hard|Timar|Middle East
1450-1750|Geography|Goa|South Asia
1450-1750|Easy|Qing Dynasty|East Asia
1450-1750|Hard|Aurangzeb|South Asia
1450-1750|Geography|Agra|South Asia
1450-1750|Easy|Mughal Empire|South Asia
1450-1750|Hard|Atahualpa|South America
1450-1750|Geography|Cuzco|South America
1450-1750|Easy|Zamindars|South Asia
1450-1750|Hard|Huguenots|Europe
1450-1750|Geography|Strait of Malacca|Southeast Asia
1450-1750|Easy|Akbar|South Asia
1450-1750|Hard|Thirty Years War|Europe
1450-1750|Geography|Philippines|Southeast Asia
1450-1750|Easy|Jahangir|South Asia
1450-1750|Hard|Glorious Revolution|Europe
1450-1750|Geography|Spice Islands|Southeast Asia
1450-1750|Easy|Versailles|Europe
1450-1750|Hard|Millet System|Middle East
1450-1750|Geography|Java|Southeast Asia
1450-1750|Easy|Louis XIV|Europe
1450-1750|Hard|The Great Enclosure|Africa
1450-1750|Geography|Isfahan|Middle East
1450-1750|Easy|Gutenberg|Europe
1450-1750|Hard|Battle of Panipat|South Asia
1450-1750|Geography|Jerusalem|Middle East
1450-1750|Easy|Protestant Reformation|Europe
1450-1750|Hard|Miniature Paintings|South Asia
1450-1750|Geography|Benin|Africa
1450-1750|Easy|Martin Luther|Europe
1450-1750|Hard|Aceh|Southeast Asia
1450-1750|Geography|Sahel|Africa
1450-1750|Easy|John Calvin|Europe
1450-1750|Hard|Qianlong|East Asia
1450-1750|Geography|Lake Victoria|Africa
1450-1750|Easy|The Papacy|Europe
1450-1750|Geography|Amsterdam|Europe
1450-1750|Easy|Indulgences|Europe
1450-1750|Geography|London|Europe
1450-1750|Easy|Manchus|East Asia
1450-1750|Geography|Paris|Europe
1450-1750|Easy|Mehmet II|Middle East
1450-1750|Geography|Moscow|Russia
1450-1750|Easy|Suleiman the Magnificent|Middle East
1450-1750|Geography|Kamchatka Peninsula|Russia
1450-1750|Easy|Fluyt|Europe
1450-1750|Geography|Novgorod|Russia
1450-1750|Easy|Carrack|Europe
1450-1750|Geography|Haiti|Central America
1450-1750|Easy|Caravel|Europe
1450-1750|Geography|Saint Domingue|Central America
1450-1750|Easy|Henry the Navigator|Europe
1450-1750|Geography|Lake Texcoco|Central America
1450-1750|Easy|Christopher Columbus|Europe
1450-1750|Easy|The Asante|Africa
1450-1750|Easy|Kingdom of Kongo|Africa
1450-1750|Easy|Incan Mit'a System|South America
1450-1750|Easy|Quipus|South America
1450-1750|Easy|Hacienda System|Central America
1450-1750|Easy|Encomienda System|Central America
1450-1750|Easy|Casta System|Central America
1450-1750|Easy|Songhai Empire|Africa
1450-1750|Easy|Silk|East Asia
1450-1750|Easy|Maroon Societies|Central America
1450-1750|Easy|Boyars|Russia
1450-1750|Easy|Reconquista|Europe
1450-1750|Easy|Porcelain|East Asia
1450-1750|Easy|Taj Mahal|South Asia
1450-1750|Easy|Shah Jahan|South Asia
1450-1750|Easy|Safavid Empire|Middle East
1450-1750|Easy|Shi'a Islam|Middle East
1450-1750|Easy|Mercantilism|Europe
1450-1750|Easy|Joint-Stock Company|Europe
1450-1750|Easy|Peter the Great|Russia
1450-1750|Easy|Canton System|East Asia
1450-1750|Easy|Kowtow|East Asia
1450-1750|Easy|Sikhism|South Asia
1450-1750|Easy|Guru Nanak|South Asia
1450-1750|Easy|Swahili Coast|Africa
1450-1750|Easy|Timbuktu|Africa
1450-1750|Easy|Potosi|South America
1450-1750|Easy|Monsoon Winds|South Asia
1450-1750|Easy|Hajj|Middle East
1450-1750|Easy|John Locke|Europe
1450-1750|Easy|Jesuits|Europe
1450-1750|Easy|Isaac Newton|Europe
1450-1750|Easy|the Renaissance|Europe
1450-1750|Easy|Michelangelo|Europe
1450-1750|Easy|Catherine the Great|Russia
1450-1750|Easy|Cossacks|Russia
1450-1750|Easy|Romanov Dynasty|Russia
1450-1750|Easy|Kangxi|East Asia
1450-1750|Easy|95 Theses|Europe
1450-1750|Easy|Northwest Passage|North America
1450-1750|Easy|Shah Abbas|Middle East
1750-1900|Easy|the Enlightenment|Europe
1750-1900|Hard|Lucretia Mott|North America
1750-1900|Geography|The Balkans|Europe
1750-1900|Easy|Mary Wollstonecraft|Europe
1750-1900|Hard|Lola Rodriguez de Tio|Central America
1750-1900|Geography|Hong Kong|East Asia
1750-1900|Easy|Olympe de Gouges|Europe
1750-1900|Hard|Samory Toure|Africa
1750-1900|Geography|Shanghai|East Asia
1750-1900|Easy|Seneca Falls Convention|North America
1750-1900|Hard|Yaa Asantewaa War|Africa
1750-1900|Geography|Sudan|Africa
1750-1900|Easy|Elizabeth Cady Stanton|North America
1750-1900|Hard|Sokoto Caliphate|Africa
1750-1900|Geography|Buenos Aires|South America
1750-1900|Easy|Simon Bolivar|South America
1750-1900|Hard|Mahdist Wars|Africa
1750-1900|Geography|Siam|Southeast Asia
1750-1900|Easy|Letter From Jamaica|Central America
1750-1900|Hard|Gran Colombia|South America
1750-1900|Geography|Manila|Southeast Asia
1750-1900|Easy|Declaration of Rights of Man and Citizen|Europe
1750-1900|Hard|Jose de San Martin|South America
1750-1900|Geography|Yucatan Peninsula|Central America
1750-1900|Easy|Declaration of Independence|North America
1750-1900|Hard|Miguel Hidalgo|Central America
1750-1900|Geography|Haiti|Central America
1750-1900|Easy|Toussaint L'Ouverture|Central America
1750-1900|Hard|Benito Juarez|Central America
1750-1900|Geography|Jamaica|Central America
1750-1900|Easy|Napoleon|Europe
1750-1900|Hard|Menelik II|Africa
1750-1900|Geography|Cape Colony|Africa
1750-1900|Easy|Voltaire|Europe
1750-1900|Hard|Asante Kingdom|Africa
1750-1900|Geography|Zanzibar|Africa
1750-1900|Easy|Rousseau|Europe
1750-1900|Hard|Battle of Adwa|Africa
1750-1900|Geography|Gold Coast|Africa
1750-1900|Easy|Meiji Restoration|East Asia
1750-1900|Hard|Shaka Zulu|Africa
1750-1900|Geography|Bay of Bengal|South Asia
1750-1900|Easy|Unilever|Europe
1750-1900|Hard|Liberia|Africa
1750-1900|Geography|Calcutta|South Asia
1750-1900|Easy|Adam Smith|Europe
1750-1900|Hard|King Mongkut|Southeast Asia
1750-1900|Geography|Port Arthur|East Asia
1750-1900|Easy|Karl Marx|Europe
1750-1900|Hard|Decembrist Revolt|Russia
1750-1900|Geography|Volga River|Russia
1750-1900|Easy|French Revolution|Europe
1750-1900|Hard|Sergei Witte|Russia
1750-1900|Geography|Caucasus Mountains|Russia
1750-1900|Easy|Laissez-faire|Europe
1750-1900|Hard|Doctrine of Lapse|South Asia
1750-1900|Geography|Ural Mountains|Russia
1750-1900|Easy|Haitian Revolution|Central America
1750-1900|Hard|Josiah Wedgwood|Europe
1750-1900|Geography|Rio Grande|North America
1750-1900|Easy|American Revolution|North America
1750-1900|Geography|Hudson Bay|North America
1750-1900|Easy|Social Darwinism|Europe
1750-1900|Geography|Sao Paulo|South America
1750-1900|Easy|Charles Darwin|Europe
1750-1900|Geography|Vienna|Europe
1750-1900|Easy|King Leopold II|Europe
1750-1900|Geography|Danube River|Europe
1750-1900|Easy|The Belgian Free State|Africa
1750-1900|Geography|Niger River|Africa
1750-1900|Easy|Tupac Amaru|South America
1750-1900|Geography|Lake Victoria|Africa
1750-1900|Easy|Sepoy Rebellion|South Asia
1750-1900|Geography|Lake Superior|North America
1750-1900|Easy|Cherokee Nation|North America
1750-1900|Geography|Deccan Plateau|South Asia
1750-1900|Easy|Zulu Kingdom|Africa
1750-1900|Geography|Strait of Malacca|Southeast Asia
1750-1900|Easy|Ghost Dance|North America
1750-1900|Geography|Mekong River|Southeast Asia
1750-1900|Easy|Xhosa Cattle-Killing Movement|Africa
1750-1900|Geography|Philippines|Southeast Asia
1750-1900|Easy|Opium Wars|East Asia
1750-1900|Geography|Malay Peninsula|Southeast Asia
1750-1900|Easy|Chinese Exclusion Act|North America
1750-1900|Geography|Sumatra|Southeast Asia
1750-1900|Easy|Otto von Bismarck|Europe
1750-1900|Geography|Taiwan|East Asia
1750-1900|Easy|Congress of Vienna|Europe
1750-1900|Easy|Manifest Destiny|North America
1750-1900|Easy|Trail of Tears|North America
1750-1900|Easy|Transcontinental Railroad|North America
1750-1900|Easy|Caudillos|South America
1750-1900|Easy|Panama Canal|Central America
1750-1900|Easy|Berlin Conference|Europe
1750-1900|Easy|Self-Strengthening Movement|East Asia
1750-1900|Easy|Boer War|Africa
1750-1900|Easy|Suez Canal|Africa
1750-1900|Easy|British Raj|South Asia
1750-1900|Easy|Boxer Rebellion|East Asia
1750-1900|Easy|Treaty of Nanjing|East Asia
1750-1900|Easy|Trans-Siberian Railroad|Russia
1750-1900|Easy|Crimean War|Russia
1750-1900|Easy|Frederick Douglas|North America
1750-1900|Easy|Matthew Perry Expedition|East Asia
1750-1900|Easy|Communist Manifesto|Europe
1750-1900|Easy|Louis Pasteur|Europe
1750-1900|Easy|Steam Engine|Europe
1750-1900|Easy|James Watt|Europe
1750-1900|Easy|Susan B. Anthony|North America
1750-1900|Easy|Dutch East Indies|Southeast Asia
1750-1900|Easy|Philippine Revolution|Southeast Asia
1750-1900|Easy|Emancipation of the Serfs|Russia
1750-1900|Easy|East India Company|South Asia
1750-1900|Easy|William Wilberforce|Europe
1750-1900|Easy|Montesquieu|Europe
1750-1900|Easy|Taiping Rebellion|East Asia
1900-2001|Easy|Tsar Nicholas II|Russia
1900-2001|Hard|Sandinista-Contras|Central America
1900-2001|Geography|Rwanda|Africa
1900-2001|Easy|Woodrow Wilson|North America
1900-2001|Hard|Mengistu Haile Mariam|Africa
1900-2001|Geography|Angola|Africa
1900-2001|Easy|Vladimir Lenin|Russia
1900-2001|Hard|White Revolution|Middle East
1900-2001|Geography|Kerala|South Asia
1900-2001|Easy|Karl Marx|Europe
1900-2001|Hard|Biafra Secessionist Movement|Africa
1900-2001|Geography|Cambodia|Southeast Asia
1900-2001|Easy|Augusto Pinochet|South America
1900-2001|Hard|Julius Nyerere|Africa
1900-2001|Geography|Uganda|Africa
1900-2001|Easy|Mexican Revolution|North America
1900-2001|Hard|Sirimavo Bandaranaike|South Asia
1900-2001|Geography|Afghanistan|Middle East
1900-2001|Easy|The New Deal|North America
1900-2001|Hard|Mahindra and Mahindra|South Asia
1900-2001|Geography|Finland|Europe
1900-2001|Easy|Five Year Plan|Russia
1900-2001|Hard|Wangari Maathai|Africa
1900-2001|Geography|Chile|South America
1900-2001|Easy|Manchukuo|East Asia
1900-2001|Hard|Leon Trotsky|Russia
1900-2001|Geography|Yugoslavia|Europe
1900-2001|Easy|Indian National Congress|South Asia
1900-2001|Hard|Weimar Republic|Europe
1900-2001|Geography|Nagasaki|East Asia
1900-2001|Easy|Winston Churchill|Europe
1900-2001|Hard|Zapatistas|North America
1900-2001|Geography|Hiroshima|East Asia
1900-2001|Easy|Franklin Roosevelt|North America
1900-2001|Hard|Falklands War|South America
1900-2001|Geography|Myanmar|Southeast Asia
1900-2001|Easy|Joseph Stalin|Russia
1900-2001|Hard|Operation Condor|South America
1900-2001|Geography|Kashmir|South Asia
1900-2001|Easy|USSR|Russia
1900-2001|Hard|Zaibatsu|East Asia
1900-2001|Geography|Bangladesh|South Asia
1900-2001|Easy|Tutsi|Africa
1900-2001|Hard|Dien Bien Phu|Southeast Asia
1900-2001|Geography|Darfur|Africa
1900-2001|Easy|Sukarno|Southeast Asia
1900-2001|Hard|Jawaharlal Nehru|South Asia
1900-2001|Geography|Punjab|South Asia
1900-2001|Easy|Kwame Nkrumah|Africa
1900-2001|Hard|Muhammad Ali Jinnah|South Asia
1900-2001|Geography|Delhi|South Asia
1900-2001|Easy|Warsaw Pact|Europe
1900-2001|Hard|Mustafa Kemal Ataturk|Middle East
1900-2001|Geography|Calcutta|South Asia
1900-2001|Easy|Ho Chi Minh|Southeast Asia
1900-2001|Hard|F.W. de Klerk|Africa
1900-2001|Geography|Hong Kong|East Asia
1900-2001|Easy|Gamal Abdel Nasser|Middle East
1900-2001|Hard|Amritsar|South Asia
1900-2001|Geography|Tehran|Middle East
1900-2001|Easy|Quebecois|North America
1900-2001|Hard|Mekong River|Southeast Asia
1900-2001|Geography|Belfast|Europe
1900-2001|Easy|Partition of India|South Asia
1900-2001|Hard|Rhineland|Europe
1900-2001|Geography|Siberia|Russia
1900-2001|Easy|Francisco Franco|Europe
1900-2001|Easy|Idi Amin|Africa
1900-2001|Easy|Shining Path|South America
1900-2001|Easy|Nelson Mandela|Africa
1900-2001|Easy|Mohandas Gandhi|South Asia
1900-2001|Easy|Martin Luther King Jr.|North America
1900-2001|Easy|Margaret Thatcher|Europe
1900-2001|Easy|Deng Xiaoping|East Asia
1900-2001|Easy|Ronald Reagan|North America
1900-2001|Easy|ASEAN|Southeast Asia
1900-2001|Easy|Bollywood|South Asia
1900-2001|Easy|BBC|Europe
1900-2001|Easy|Weibo|East Asia
1900-2001|Easy|Banksy|Europe
1900-2001|Easy|Bolsheviks|Russia
1900-2001|Easy|gulags|Russia
1900-2001|Easy|perestroika|Russia
1900-2001|Easy|Nikita Khrushchev|Russia
1900-2001|Easy|Mikhail Gorbachev|Russia
1900-2001|Easy|Boris Yeltsin|Russia
1900-2001|Easy|Chernobyl|Russia
1900-2001|Easy|Glasnost|Russia
1900-2001|Easy|Mussolini|Europe
1900-2001|Easy|Lech Walesa|Europe
1900-2001|Easy|NAFTA|North America
1900-2001|Easy|Salvador Allende|South America
1900-2001|Easy|Mao Zedong|East Asia
1900-2001|Easy|Chiang Kai-Shek|East Asia
1900-2001|Easy|Great Leap Forward|East Asia
1900-2001|Easy|Tiananmen Square|East Asia
1900-2001|Easy|Khmer Rouge|Southeast Asia
1900-2001|Easy|Pol Pot|Southeast Asia
1900-2001|Easy|Salt March|South Asia
1900-2001|Easy|Balfour Declaration|Middle East
1900-2001|Easy|OPEC|Middle East
1900-2001|Easy|apartheid|Africa
1900-2001|Easy|Suez Canal|Africa
1900-2001|Easy|Berlin Wall|Europe
`;

export const MAP_TERMS: MapTerm[] = rawTerms.trim().split("\n").map((line, index) => {
  const [period, category, name, region] = line.split("|");
  return {
    id: `${period}-${category}-${index}`,
    period: period as MapPeriod,
    category: category as MapCategory,
    name,
    region: region as MapRegion,
  };
});