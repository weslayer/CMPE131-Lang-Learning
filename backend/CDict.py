import logging
import time

import pygtrie



def vowel_tone_to_unicode(vowel, tone):

    diacritic_mappings = [
        "\u0304", "\u0301", "\u030C", "\u0300", "\u0307"
    ]

    if(vowel == "v"):
        return "ü" + diacritic_mappings[tone]




class CDictEntry:

    def __init__(self, id, trad="", simp="", reading="", senses=[], ) :
        self.id = id
        self.trad = trad
        self.simp = simp
        self.reading = reading
        self.senses = senses




class CDict:
    def __init__(self, filepath):
        self.filepath = filepath
        self.search_trie = pygtrie.CharTrie()
        self.load()

    def load(self):
        start = time.perf_counter()
        logging.info("Loading dictionary...")

        self.entries = {}
        self.index = {}
        with open(self.filepath, "r", encoding="utf-8") as file:
            
            i = 0
            line = file.readline()
            while(0 < len(line)):
                if(line[0] != "#"):
                    # print(line)
                    j, k = 0, line.index(" ")
                    trad = line[j:k]
                    j, k = k + 1, line.index(" ", k + 1)
                    simp = line[j:k]
                    j, k = k + 2, line.index("]", k + 2)
                    reading = line[j:k]

                    senses = []
                    try:
                        j, k = k + 3, line.index("/", k + 3)
                        while(True):
                            senses.append(line[j:k])
                            j, k = k + 1, line.index("/", k + 1)
                    except ValueError:
                        pass
                    
                    self.entries[i] = CDictEntry(i, trad, simp, reading, senses)

                    self.search_trie[trad] = "True"
                    self.search_trie[simp] = "True"
                    if(trad in self.index):
                        self.index[trad].append(i)
                    else:
                        self.index[trad] = [i]
                    
                    if(trad != simp):
                        if(simp in self.index):
                            self.index[simp].append(i)
                        else:
                            self.index[simp] = [i]

                    i += 1
                line = file.readline()

            # root = ET.parse(file)

        elapsed = time.perf_counter() - start
        logging.info("Dictionary Loaded. Took %ds.", elapsed)
        logging.info("%d entries loaded.", len(self.entries))


    def tokenize(self, text : str):
        i = 0
        n = len(text)

        out = []
        while(i < n):
            token = self.search_trie.longest_prefix(text[i:], ).key
            print(token, text[i: ])
            if(token is None):
                out.append({
                    "token": text[i],
                    "type": "noun"
                })
                i += 1
                continue
            out.append({
                "token": token,
                "type": "noun",
                "index": i
            })
            i += len(token)
        return out
        
        


    def tokenize_search(self, text:str):
        # print(dict.tokenizer.parse(text))
        for token_info in self.tokenizer.parse(text).strip().split("\n"):
            token_info = token_info.split()
            if(token_info[0] == "EOS"):
                continue
            print(token_info)
            
            # self.search(token_info[0])



    def search(self, term : str):
        if(term in self.index):
            return [self.entries[e] for e in self.index[term]]
            # print(self.entries[kanji])
        else:
            return None
            # print(kanji+" unknown")