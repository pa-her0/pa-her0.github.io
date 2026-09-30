#include<bits/stdc++.h>
using namespace std;

#define int long long

void slove(){
    string s;
    cin >> s;
    bool t1 = 1;
    if(s.size() != 8) t1 = 0;
    string s1 = "aeiou";
    for(int i = 0; i < 8; i++){
        if(i % 2){
            if(s1.find(s[i]) == string::npos){
                t1 = 0;
            }
        }else{
            if(s1.find(s[i]) != string::npos){
                t1 = 0;
            }
        }
    }
    if(!t1){
        cout << "Well-Being" << endl;
    }else{
        cout << "Suspected Virus" << endl;
    }
}

signed main(){
    int t = 1;
    cin >> t;
    while(t--){
        slove();
    }
}