import CDict

if __name__ == "__main__":
    c_dict = CDict.CDict("./data/cedict_ts.txt")

    jieba_dict_entries = []
    with open("./data/dict.txt.big", "r") as file:
        jieba_dict_entries = [ i.split(" ") for i in file.readlines()[:-1]]
    # print(jieba_dict_entries)
    jieba_dict_entries = [ i for i in jieba_dict_entries if i[0] in c_dict.index] 
    # print(jieba_dict_entries)
    with open("./data/dict.txt.reduced", "w") as file:
        file.write("".join([ " ".join(i) for i in jieba_dict_entries]))
        