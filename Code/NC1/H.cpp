#include<bits/stdc++.h>
using namespace std;

#define int long long
vector<vector<double>> dp(101, vector<double>(101, 0.00));
map<array<int,3>,int> id;
vector<array<int,3>> hand;
void slove(){
    int k;
    cin >> k;
    string s1,s2;
    cin >> s1 >> s2;
    array<int,3> t1 = {0,0,0};
    array<int,3> t2 = {0,0,0};
    for(int i = 0; i < 3; i++){
        if(s1[i] == 'R') t1[0] ++;
        else if(s1[i] == 'S') t1[1] ++;
        else if(s1[i] == 'P') t1[2] ++;
    }
    for(int i = 0; i < 3; i++){
        if(s2[i] == 'R') t2[0] ++;
        else if(s2[i] == 'S') t2[1] ++;
        else if(s2[i] == 'P') t2[2] ++;
    }
    int ID1 = id[t1];
    int ID2 = id[t2];
    int state = ID1 * 10 + ID2;
    cout << fixed << setprecision(10);
    // cout << dp[k][state] << endl;
    double ans = 0;
    if(k <= 100){
        cout << dp[k][state] << endl;
    }else{
        double d = dp[100][state] - dp[99][state];
        cout << dp[100][state] + (k - 100) * d << endl;
    }
}

void init(){
     
    int id1 = 0;
    for(int i = 0; i <= 3; i++){
        for(int j = 0; j + i <= 3; j++){
            int k = 3 - i - j;
            array<int,3> temp = {i, j, k};
            id[temp] = id1 ++;
            hand.push_back(temp);
        }
    }
    auto score = [&](int x1, int y1) -> double {
        if((x1 == 0 && y1 == 1) || (x1 == 1 && y1 == 2) || (x1 == 2 && y1 == 0)){
            return 3;
        }else if((x1 == y1)){
            return 1;
        }else return 0;
    };

    for(int T = 1; T <= 100; T++){
    // A 牌的种类
        for(int i = 0; i < 10; i++){
            // B 牌的种类
            for(int j = 0; j < 10; j++){
                int state = i * 10 + j;
                // A 打哪张牌
                double best = 0;    
                for(int i1 = 0; i1 < 3; i1++){
                    if(hand[i][i1] == 0) continue;
                    // B 打哪张牌
                    double worst = (double)1e9;
                    for(int j1 = 0; j1 < 3; j1++){
                        auto tt2 = hand[j];
                        auto tt1 = hand[i];
                        if(tt2[j1] == 0) continue;
                        tt2[j1] --;
                        tt1[i1] --;
                        double cur = score(i1, j1);

                        // 补牌环节
                        double s1 = 0;
                        for(int add1 = 0; add1 < 3; add1 ++){
                            for(int add2 = 0; add2 < 3; add2++){
                                auto temp1 = tt1;
                                auto temp2 = tt2;
                                temp1[add1] ++;
                                temp2[add2] ++;
                                int p1 = id[temp1];
                                int p2 = id[temp2];
                                int ID = p1 * 10 + p2;
                                s1 += dp[T-1][ID];
                            }
                        }
                        cur += (s1 / (9.0));
                        worst = min(worst, cur);
                    }
                    best = max(best, worst);
                }
                dp[T][state] = best;
            }
        }
    }
}

signed main(){
    ios::sync_with_stdio(false);
    cin.tie(0);
    cout.tie(0);
    init();
    int t = 1;
    cin >> t;
    while(t--){
        slove();
    }
}