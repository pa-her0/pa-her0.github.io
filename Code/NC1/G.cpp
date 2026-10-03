#include<bits/stdc++.h>
using namespace std;

#define int long long

void slove(){
    //  cout << sqrt(1.01 * 1.01-1) / 0.0101 << endl;
    int m;
    cin >> m;
    int t1 = m;
    cout << 2 * m << endl;
    for(int i = 0; i < 10; i++){
        for(int j = 0; j < 10; j++){
            cout << (i) * 0.0101 << " " << j * 0.0101 << " " << 0 << endl;
            t1 --;
            if(t1 == 0) break;
        }
        if(t1 == 0) break;
    }
    for(int i = 0; i < 10; i++){
        for(int j = 0; j < 10; j++){
            cout << (i) * 0.0101 << " " << j * 0.0101 << " " <<  1 << endl;
            m --;
            if(m == 0) break;
        }
        if(m == 0) break;
    }
    // cout << "------------" << endl;;
}

signed main(){
    int t = 1;
    cin >> t;
    while(t--){
        slove();
    }
}